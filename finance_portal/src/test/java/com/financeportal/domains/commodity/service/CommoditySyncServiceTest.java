package com.financeportal.domains.commodity.service;

import com.financeportal.client.yahoo.YahooQuoteClient;
import com.financeportal.domains.commodity.client.TruncgilIntegrationClient;
import com.financeportal.domains.commodity.dto.CommodityDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CommoditySyncServiceTest {

    @Mock private YahooQuoteClient yahooClient;
    @Mock private TruncgilIntegrationClient truncgilClient;
    @Mock private CacheService cacheService;
    @Mock private CommodityService commodityService;

    @InjectMocks private CommoditySyncService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "commoditySymbols",
            new String[]{"GC=F","SI=F","PL=F","PA=F","CL=F","BZ=F","NG=F","HG=F","ZW=F","ZC=F","KC=F","CC=F","CT=F"});
    }

    @Test
    void fetchCommodities_nonEmpty_savesToCache() {
        MarketAssetDto gold = new MarketAssetDto();
        gold.setSymbol("GC=F");
        gold.setPrice(new BigDecimal("2400"));
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of(gold));

        CommodityDto mapped = new CommodityDto();
        mapped.setSymbol("GC=F");
        when(commodityService.mapToCommodity(any(MarketAssetDto.class))).thenReturn(mapped);

        service.fetchCommodities();

        verify(cacheService).save(eq("cache:commodities"), any(), eq(5L));
    }

    @Test
    void fetchCommodities_empty_doesNotSave() {
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        service.fetchCommodities();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void fetchCommodities_null_doesNotSave() {
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(null);

        service.fetchCommodities();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void fetchTurkishGoldData_nonEmpty_savesToCache() {
        CommodityDto gram = new CommodityDto();
        gram.setSymbol("GRAM_ALTIN");
        when(truncgilClient.fetchLiveTurkishGold()).thenReturn(List.of(gram));

        service.fetchTurkishGoldData();

        verify(cacheService).save(eq("cache:turkish_gold"), any(), eq(5L));
    }

    @Test
    void fetchTurkishGoldData_empty_doesNotSave() {
        when(truncgilClient.fetchLiveTurkishGold()).thenReturn(List.of());

        service.fetchTurkishGoldData();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void fetchTurkishGoldData_null_doesNotSave() {
        when(truncgilClient.fetchLiveTurkishGold()).thenReturn(null);

        service.fetchTurkishGoldData();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void fetchCommodities_passesAllSymbols() {
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        service.fetchCommodities();

        org.mockito.ArgumentCaptor<String[]> symCap = org.mockito.ArgumentCaptor.forClass(String[].class);
        verify(yahooClient).fetchQuotes(symCap.capture(), eq("EMTİA"));
        // 13 commodity sembolü vardı
        org.junit.jupiter.api.Assertions.assertEquals(13, symCap.getValue().length);
    }
}
