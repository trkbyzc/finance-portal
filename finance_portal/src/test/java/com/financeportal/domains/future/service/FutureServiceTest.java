package com.financeportal.domains.future.service;

import com.financeportal.client.yahoo.YahooQuoteClient;
import com.financeportal.domains.future.dto.FutureDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FutureServiceTest {

    @Mock
    private YahooQuoteClient yahooClient;

    @Mock
    private CacheService cacheService;

    @InjectMocks
    private FutureService service;

    // -------- getFutures (cache delegation) --------

    @Test
    @SuppressWarnings("unchecked")
    void getFutures_delegatesToCacheServiceWithV2Key() {
        when(cacheService.getOrFetch(anyString(), any(), anyLong())).thenReturn(List.of());

        service.getFutures();

        // CACHE_KEY = "cache:futures:v2", TTL = 5 dk
        verify(cacheService).getOrFetch(eq("cache:futures:v2"), any(), eq(5L));
    }

    // -------- syncFutures (forced refresh) --------

    @Test
    void syncFutures_freshDataNonEmpty_savesToCache() {
        MarketAssetDto asset = new MarketAssetDto("ES=F", "S&P 500 Future", "FUT",
                new BigDecimal("5800"), null, 1000L);
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of(asset));

        service.syncFutures();

        // Cache'e v2 key ile yazıldı
        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(cacheService).save(eq("cache:futures:v2"), payload.capture(), eq(5L));

        List<FutureDto> saved = (List<FutureDto>) payload.getValue();
        assertEquals(1, saved.size());
        assertEquals("ES=F", saved.get(0).getSymbol());
        assertEquals("S&P 500 Future", saved.get(0).getName());
    }

    @Test
    void syncFutures_emptyFresh_skipsSave() {
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        service.syncFutures();

        // Boş gelirse cache dokunulmuyor
        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void syncFutures_yahooClientPassesAllFutureSymbols() {
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        service.syncFutures();

        // 10 symbol: ES, NQ, YM, RTY (endeks) + ZN, ZB, ZF (tahvil) + 6E, 6B, 6J (döviz)
        ArgumentCaptor<String[]> symCaptor = ArgumentCaptor.forClass(String[].class);
        verify(yahooClient).fetchQuotes(symCaptor.capture(), anyString());
        String[] symbols = symCaptor.getValue();
        assertEquals(10, symbols.length);

        List<String> list = List.of(symbols);
        assertTrue(list.contains("ES=F"));
        assertTrue(list.contains("ZN=F"));
        assertTrue(list.contains("6E=F"));
    }

    @Test
    void syncFutures_mapsAllFields_yahooToFutureDto() {
        MarketAssetDto asset = new MarketAssetDto();
        asset.setSymbol("NQ=F");
        asset.setName("Nasdaq Future");
        asset.setAssetType("FUT");
        asset.setPrice(new BigDecimal("20000"));
        asset.setChangePercent(new BigDecimal("0.5"));
        asset.setVolume(50000L);
        asset.setYahooSymbol("NQ=F");
        asset.setChartType("LINE");
        asset.setAssetCategory("GLOBAL_FUTURE");

        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of(asset));

        service.syncFutures();

        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(cacheService).save(eq("cache:futures:v2"), payload.capture(), anyLong());
        @SuppressWarnings("unchecked")
        FutureDto saved = ((List<FutureDto>) payload.getValue()).get(0);

        // Tüm alanlar mapping yapıldı mı?
        assertEquals("NQ=F", saved.getSymbol());
        assertEquals("Nasdaq Future", saved.getName());
        assertEquals(new BigDecimal("20000"), saved.getPrice());
        assertEquals(new BigDecimal("0.5"), saved.getChangePercent());
        assertEquals(50000L, saved.getVolume());
        assertEquals("LINE", saved.getChartType());
        assertEquals("GLOBAL_FUTURE", saved.getAssetCategory());
    }

    @Test
    void syncFutures_multipleAssets_allMapped() {
        List<MarketAssetDto> assets = List.of(
                quickAsset("ES=F", new BigDecimal("5800")),
                quickAsset("NQ=F", new BigDecimal("20000")),
                quickAsset("YM=F", new BigDecimal("44000"))
        );
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(assets);

        service.syncFutures();

        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(cacheService).save(eq("cache:futures:v2"), payload.capture(), anyLong());
        @SuppressWarnings("unchecked")
        List<FutureDto> saved = (List<FutureDto>) payload.getValue();
        assertEquals(3, saved.size());
    }

    private MarketAssetDto quickAsset(String symbol, BigDecimal price) {
        MarketAssetDto a = new MarketAssetDto();
        a.setSymbol(symbol);
        a.setPrice(price);
        return a;
    }
}
