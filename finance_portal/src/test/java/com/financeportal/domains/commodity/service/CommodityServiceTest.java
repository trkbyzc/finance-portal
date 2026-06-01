package com.financeportal.domains.commodity.service;

import com.financeportal.client.yahoo.YahooQuoteClient;
import com.financeportal.domains.commodity.client.TruncgilIntegrationClient;
import com.financeportal.domains.commodity.dto.CommodityDto;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.domains.currency.service.CurrencyService;
import com.financeportal.service.cache.CacheService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CommodityServiceTest {

    @Mock
    private YahooQuoteClient yahooClient;

    @Mock
    private TruncgilIntegrationClient truncgilClient;

    @Mock
    private CurrencyService currencyService;

    @Mock
    private CacheService cacheService;

    @InjectMocks
    private CommodityService service;

    // -------- getCommodities (cache delegation) --------

    @Test
    void getCommodities_delegatesToCacheWith5MinTtl() {
        when(cacheService.getOrFetch(anyString(), any(), anyLong())).thenReturn(List.of());

        service.getCommodities();

        org.mockito.Mockito.verify(cacheService).getOrFetch(eq("cache:commodities"), any(), eq(5L));
    }

    // -------- getTurkishGold (Truncgil → fallback math) --------

    @Test
    @SuppressWarnings("unchecked")
    void getTurkishGold_truncgilReturnsData_returnsAsIs() {
        // Cache miss → supplier çalışır
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong()))
                .thenAnswer(inv -> ((Supplier<List<CommodityDto>>) inv.getArgument(1)).get());

        CommodityDto gram = new CommodityDto();
        gram.setSymbol("GRAM_ALTIN");
        gram.setPrice(new BigDecimal("2500"));
        when(truncgilClient.fetchLiveTurkishGold()).thenReturn(List.of(gram));

        List<CommodityDto> result = service.getTurkishGold();

        assertEquals(1, result.size());
        assertEquals("GRAM_ALTIN", result.get(0).getSymbol());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getTurkishGold_truncgilEmpty_fallsBackToMath() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong()))
                .thenAnswer(inv -> ((Supplier<List<CommodityDto>>) inv.getArgument(1)).get());
        when(truncgilClient.fetchLiveTurkishGold()).thenReturn(List.of());

        // getCommodities çağrısı için cache miss → supplier, ons GC=F dönsün
        CommodityDto ons = new CommodityDto();
        ons.setSymbol("GC=F");
        ons.setPrice(new BigDecimal("2400"));
        ons.setChangePercent(new BigDecimal("1.5"));
        com.financeportal.model.dto.market.MarketAssetDto raw =
                new com.financeportal.model.dto.market.MarketAssetDto();
        raw.setSymbol("GC=F");
        raw.setPrice(new BigDecimal("2400"));
        raw.setChangePercent(new BigDecimal("1.5"));
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of(raw));

        // currencyService.getCurrencyRates() → USD
        CurrencyDto usd = new CurrencyDto();
        usd.setCurrencyCode("USD");
        usd.setForexSelling(new BigDecimal("34.50"));
        when(currencyService.getCurrencyRates()).thenReturn(List.of(usd));

        List<CommodityDto> result = service.getTurkishGold();

        // 4 hesaplanmış altın türü dönmeli: GRAM, ÇEYREK, TAM, CUMHURIYET
        assertEquals(4, result.size());
        assertTrue(result.stream().anyMatch(c -> "GRAM_ALTIN".equals(c.getSymbol())));
        assertTrue(result.stream().anyMatch(c -> "CEYREK_ALTIN".equals(c.getSymbol())));
        assertTrue(result.stream().anyMatch(c -> "TAM_ALTIN".equals(c.getSymbol())));
        assertTrue(result.stream().anyMatch(c -> "CUMHURIYET_ALTINI".equals(c.getSymbol())));
    }

    @Test
    @SuppressWarnings("unchecked")
    void getTurkishGold_truncgilNull_fallsBackToMath() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong()))
                .thenAnswer(inv -> ((Supplier<List<CommodityDto>>) inv.getArgument(1)).get());
        when(truncgilClient.fetchLiveTurkishGold()).thenReturn(null);

        // Math fallback dependencies — boş dönmeli (commodities yok)
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());
        when(currencyService.getCurrencyRates()).thenReturn(List.of());

        List<CommodityDto> result = service.getTurkishGold();

        // Bağımlılıklar boş → boş liste döner ama exception olmamalı
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getTurkishGold_noOnsGoldInCommodities_returnsEmpty() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong()))
                .thenAnswer(inv -> ((Supplier<List<CommodityDto>>) inv.getArgument(1)).get());
        when(truncgilClient.fetchLiveTurkishGold()).thenReturn(List.of());

        // Commodities listede GC=F yok
        com.financeportal.model.dto.market.MarketAssetDto silver =
                new com.financeportal.model.dto.market.MarketAssetDto();
        silver.setSymbol("SI=F");
        silver.setPrice(new BigDecimal("30"));
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of(silver));

        CurrencyDto usd = new CurrencyDto();
        usd.setCurrencyCode("USD");
        usd.setForexSelling(new BigDecimal("34.50"));
        when(currencyService.getCurrencyRates()).thenReturn(List.of(usd));

        List<CommodityDto> result = service.getTurkishGold();

        // GC=F olmadığı için altın hesaplanamaz, empty
        assertTrue(result.isEmpty());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getTurkishGold_noUsdInCurrencies_returnsEmpty() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong()))
                .thenAnswer(inv -> ((Supplier<List<CommodityDto>>) inv.getArgument(1)).get());
        when(truncgilClient.fetchLiveTurkishGold()).thenReturn(List.of());

        com.financeportal.model.dto.market.MarketAssetDto ons =
                new com.financeportal.model.dto.market.MarketAssetDto();
        ons.setSymbol("GC=F");
        ons.setPrice(new BigDecimal("2400"));
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of(ons));

        // USD yok currency listesinde
        CurrencyDto eur = new CurrencyDto();
        eur.setCurrencyCode("EUR");
        eur.setForexSelling(new BigDecimal("37"));
        when(currencyService.getCurrencyRates()).thenReturn(List.of(eur));

        List<CommodityDto> result = service.getTurkishGold();

        assertTrue(result.isEmpty());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getTurkishGold_mathFallback_pricesScaledByMultipliers() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong()))
                .thenAnswer(inv -> ((Supplier<List<CommodityDto>>) inv.getArgument(1)).get());
        when(truncgilClient.fetchLiveTurkishGold()).thenReturn(List.of());

        com.financeportal.model.dto.market.MarketAssetDto ons =
                new com.financeportal.model.dto.market.MarketAssetDto();
        ons.setSymbol("GC=F");
        // 31.1034768 → ~1g altın; price 3110 USD → ~100 USD/g
        ons.setPrice(new BigDecimal("3110"));
        ons.setChangePercent(new BigDecimal("0"));
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of(ons));

        CurrencyDto usd = new CurrencyDto();
        usd.setCurrencyCode("USD");
        usd.setForexSelling(new BigDecimal("40"));
        when(currencyService.getCurrencyRates()).thenReturn(List.of(usd));

        List<CommodityDto> result = service.getTurkishGold();

        CommodityDto gram = result.stream().filter(c -> "GRAM_ALTIN".equals(c.getSymbol())).findFirst().orElseThrow();
        CommodityDto ceyrek = result.stream().filter(c -> "CEYREK_ALTIN".equals(c.getSymbol())).findFirst().orElseThrow();
        CommodityDto tam = result.stream().filter(c -> "TAM_ALTIN".equals(c.getSymbol())).findFirst().orElseThrow();

        // Çeyrek = gram × 1.64, tam = gram × 6.56 — orantı doğru olmalı
        assertTrue(ceyrek.getPrice().compareTo(gram.getPrice()) > 0);
        assertTrue(tam.getPrice().compareTo(ceyrek.getPrice()) > 0);
        // Buy < sell (spread)
        assertTrue(gram.getBuyPrice().compareTo(gram.getPrice()) < 0);
    }

    @Test
    @SuppressWarnings("unchecked")
    void getTurkishGold_mathFallback_metadataFieldsSet() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong()))
                .thenAnswer(inv -> ((Supplier<List<CommodityDto>>) inv.getArgument(1)).get());
        when(truncgilClient.fetchLiveTurkishGold()).thenReturn(List.of());

        com.financeportal.model.dto.market.MarketAssetDto ons =
                new com.financeportal.model.dto.market.MarketAssetDto();
        ons.setSymbol("GC=F");
        ons.setPrice(new BigDecimal("2400"));
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of(ons));

        CurrencyDto usd = new CurrencyDto();
        usd.setCurrencyCode("USD");
        usd.setForexSelling(new BigDecimal("34.50"));
        when(currencyService.getCurrencyRates()).thenReturn(List.of(usd));

        List<CommodityDto> result = service.getTurkishGold();
        CommodityDto gram = result.get(0);

        // Metadata fields
        assertEquals("TÜRK ALTINI", gram.getAssetType());
        assertEquals("COMMODITY", gram.getAssetCategory());
        assertEquals("CANDLE", gram.getChartType());
        assertEquals("XAUTRY=X", gram.getYahooSymbol());
        assertEquals(0L, gram.getVolume());
    }
}
