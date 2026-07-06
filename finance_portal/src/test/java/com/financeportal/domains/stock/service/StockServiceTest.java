package com.financeportal.domains.stock.service;

import com.financeportal.client.yahoo.YahooQuoteClient;
import com.financeportal.domains.stock.client.BistStockClient;
import com.financeportal.domains.stock.dto.StockDto;
import com.financeportal.model.dto.market.MarketAssetDto;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
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
class StockServiceTest {

    @Mock
    private BistStockClient bistClient;

    @Mock
    private YahooQuoteClient yahooClient;

    @Mock
    private CacheService cacheService;

    @Mock
    private com.financeportal.domains.stock.client.TradingViewLogoClient logoClient;

    @InjectMocks
    private StockService service;

    @org.junit.jupiter.api.BeforeEach
    void stubLogos() {
        when(logoClient.usLogos(any())).thenReturn(java.util.Map.of());
        org.springframework.test.util.ReflectionTestUtils.setField(service, "globalStockSymbols",
            new String[]{"AAPL","MSFT","NVDA","TSLA","AMZN","GOOGL","META","NFLX","AMD","INTC",
                         "BABA","JPM","V","WMT","JNJ","PG","MA","HD","TSM","ASML",
                         "AVGO","QCOM","TXN","AMAT","MU","LRCX","KLAC","ADBE","CRM","ORCL"});
        org.springframework.test.util.ReflectionTestUtils.setField(service, "indexSymbols",
            new String[]{"XU100.IS","XU030.IS","XU050.IS","XBANK.IS","XUSIN.IS",
                         "^GSPC","^IXIC","^NDX","^DJI","BITW"});
    }

    @SuppressWarnings("unchecked")
    private void wireCacheToRunSupplier() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong()))
                .thenAnswer(inv -> ((Supplier<List<StockDto>>) inv.getArgument(1)).get());
    }

    // -------- getStocks --------

    @Test
    @SuppressWarnings("unchecked")
    void getStocks_delegatesToCacheWith5MinTtl() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong())).thenReturn(List.of());

        service.getStocks();

        verify(cacheService).getOrFetch(eq("cache:stocks"), any(), eq(5L));
    }

    @Test
    void getStocks_combinesTrAndGlobal_whenBistFetchSucceeds() {
        wireCacheToRunSupplier();
        StockDto tr = new StockDto();
        tr.setSymbol("AKBNK.IS");
        when(bistClient.fetchTurkishStocks()).thenReturn(List.of(tr));

        MarketAssetDto global = new MarketAssetDto();
        global.setSymbol("AAPL");
        global.setPrice(new BigDecimal("180"));
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of(global));

        List<StockDto> result = service.getStocks();

        assertEquals(2, result.size());
        assertTrue(result.stream().anyMatch(s -> "AKBNK.IS".equals(s.getSymbol())));
        assertTrue(result.stream().anyMatch(s -> "AAPL".equals(s.getSymbol())));
    }

    @Test
    void getStocks_bistEmpty_usesLastGoodFallback() {
        wireCacheToRunSupplier();
        // BIST canlı fetch boş döner
        when(bistClient.fetchTurkishStocks()).thenReturn(List.of());

        // Last-good cache'te kayıt var
        StockDto stale = new StockDto();
        stale.setSymbol("GARAN.IS");
        when(cacheService.<StockDto>get("cache:bist:last-good")).thenReturn(List.of(stale));

        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        List<StockDto> result = service.getStocks();

        // Last-good snapshot kullanıldı
        assertEquals(1, result.size());
        assertEquals("GARAN.IS", result.get(0).getSymbol());
    }

    @Test
    void getStocks_bistEmptyAndNoLastGood_returnsOnlyGlobal() {
        wireCacheToRunSupplier();
        when(bistClient.fetchTurkishStocks()).thenReturn(List.of());
        when(cacheService.<StockDto>get("cache:bist:last-good")).thenReturn(List.of());

        MarketAssetDto global = new MarketAssetDto();
        global.setSymbol("MSFT");
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of(global));

        List<StockDto> result = service.getStocks();

        assertEquals(1, result.size());
        assertEquals("MSFT", result.get(0).getSymbol());
    }

    @Test
    void getStocks_bistSuccess_savesLastGood() {
        wireCacheToRunSupplier();
        StockDto tr = new StockDto();
        tr.setSymbol("AKBNK.IS");
        when(bistClient.fetchTurkishStocks()).thenReturn(List.of(tr));
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        service.getStocks();

        // BIST başarılı → last-good cache güncellendi (48 saat TTL)
        verify(cacheService).save(eq("cache:bist:last-good"), any(), eq(48L * 60L));
    }

    @Test
    void getStocks_bistNull_doesNotSaveLastGood() {
        wireCacheToRunSupplier();
        when(bistClient.fetchTurkishStocks()).thenReturn(null);
        when(cacheService.<StockDto>get("cache:bist:last-good")).thenReturn(List.of());
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        service.getStocks();

        verify(cacheService, never()).save(eq("cache:bist:last-good"), any(), anyLong());
    }

    @Test
    void getStocks_globalNull_skipsGlobalSection() {
        wireCacheToRunSupplier();
        StockDto tr = new StockDto();
        tr.setSymbol("AKBNK.IS");
        when(bistClient.fetchTurkishStocks()).thenReturn(List.of(tr));
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(null);

        List<StockDto> result = service.getStocks();

        // Global null → sadece TR
        assertEquals(1, result.size());
        assertEquals("AKBNK.IS", result.get(0).getSymbol());
    }

    // -------- getIndices --------

    @Test
    @SuppressWarnings("unchecked")
    void getIndices_delegatesToCacheWith5MinTtl() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong())).thenReturn(List.of());

        service.getIndices();

        verify(cacheService).getOrFetch(eq("cache:indices"), any(), eq(5L));
    }

    @Test
    void getIndices_mapsYahooAssetsToStockDto() {
        wireCacheToRunSupplier();
        MarketAssetDto sp500 = new MarketAssetDto();
        sp500.setSymbol("^GSPC");
        sp500.setPrice(new BigDecimal("6000"));
        sp500.setName("S&P 500");
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of(sp500));

        List<StockDto> result = service.getIndices();

        assertEquals(1, result.size());
        assertEquals("^GSPC", result.get(0).getSymbol());
        assertEquals("S&P 500", result.get(0).getName());
        assertEquals(new BigDecimal("6000"), result.get(0).getPrice());
    }

    // -------- syncStocks --------

    @Test
    void syncStocks_resultNonEmpty_savesCache() {
        StockDto tr = new StockDto();
        tr.setSymbol("AKBNK.IS");
        when(bistClient.fetchTurkishStocks()).thenReturn(List.of(tr));
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        service.syncStocks();

        // 5dk TTL ile cache'e yaz
        verify(cacheService).save(eq("cache:stocks"), any(), eq(5L));
    }

    @Test
    void syncStocks_emptyResult_doesNotSaveStocksCache() {
        when(bistClient.fetchTurkishStocks()).thenReturn(List.of());
        when(cacheService.<StockDto>get("cache:bist:last-good")).thenReturn(List.of());
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        service.syncStocks();

        // Boş → cache:stocks save edilmez
        verify(cacheService, never()).save(eq("cache:stocks"), any(), anyLong());
    }

    @Test
    @SuppressWarnings("unchecked")
    void syncIndices_invokesGetIndices() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong())).thenReturn(List.of());

        service.syncIndices();

        verify(cacheService).getOrFetch(eq("cache:indices"), any(), eq(5L));
    }

    // -------- index symbol list shape --------

    @Test
    void getIndices_yahooCallReceivesExpectedSymbols() {
        wireCacheToRunSupplier();
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        service.getIndices();

        org.mockito.ArgumentCaptor<String[]> symCap = org.mockito.ArgumentCaptor.forClass(String[].class);
        verify(yahooClient).fetchQuotes(symCap.capture(), anyString());

        List<String> symbols = List.of(symCap.getValue());
        // BIST 5 + US 4 + Crypto 1 = 10
        assertEquals(10, symbols.size());
        assertTrue(symbols.contains("XU100.IS"));
        assertTrue(symbols.contains("^GSPC"));
        assertTrue(symbols.contains("BITW"));
        assertFalse(symbols.contains("AAPL")); // AAPL global stock, indices'te değil
    }
}
