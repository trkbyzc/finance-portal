package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.client.binance.BinanceChartClient;
import com.financeportal.client.yahoo.YahooChartClient;
import com.financeportal.domains.crypto.client.CoinGeckoChartClient;
import com.financeportal.domains.crypto.service.CryptoIdRegistry;
import com.financeportal.model.dto.market.HistoricalDataDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CryptoChartStrategyTest {

    @Mock
    private YahooChartClient yahooChartClient;
    @Mock
    private BinanceChartClient binanceChartClient;
    @Mock
    private CoinGeckoChartClient coinGeckoChartClient;
    @Mock
    private CryptoIdRegistry cryptoIdRegistry;
    @Mock
    private com.financeportal.config.datasource.DataSourcePolicy dataSourcePolicy;

    @InjectMocks
    private CryptoChartStrategy strategy;

    /** MIN_ACCEPTABLE_POINTS=5; n nokta üreten yardımcı. */
    private List<HistoricalDataDto> points(int n) {
        List<HistoricalDataDto> list = new ArrayList<>();
        IntStream.range(0, n).forEach(i -> list.add(new HistoricalDataDto()));
        return list;
    }

    @Test
    void supports_cryptoCategory_caseInsensitive() {
        assertTrue(strategy.supports("CRYPTO", "BTC"));
        assertTrue(strategy.supports("crypto", "BTC"));
        assertFalse(strategy.supports("TR_STOCK", "AKBNK"));
        assertFalse(strategy.supports(null, "X"));
    }

    @Test
    void fetch_yahooSufficient_returnsYahoo_skipsFallbacks() {
        List<HistoricalDataDto> yahoo = points(5);
        when(yahooChartClient.fetchChartHistory(any(), any(), any(), any(), any())).thenReturn(yahoo);

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("BTC", "1y", null, null, null);

        assertSame(yahoo, result);
        verify(binanceChartClient, never()).fetchKlines(anyString(), anyString());
        verify(coinGeckoChartClient, never()).fetchOhlc(anyString(), anyString());
    }

    @Test
    void fetch_yahooInsufficient_fallsBackToBinance() {
        when(yahooChartClient.fetchChartHistory(any(), any(), any(), any(), any())).thenReturn(points(2));
        List<HistoricalDataDto> binance = points(10);
        when(binanceChartClient.fetchKlines(anyString(), anyString())).thenReturn(binance);

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("PEPE", "1y", null, null, null);

        assertSame(binance, result);
        verify(coinGeckoChartClient, never()).fetchOhlc(anyString(), anyString());
    }

    @Test
    void fetch_yahooAndBinanceInsufficient_fallsBackToCoinGecko() {
        when(yahooChartClient.fetchChartHistory(any(), any(), any(), any(), any())).thenReturn(points(1));
        when(binanceChartClient.fetchKlines(anyString(), anyString())).thenReturn(points(2));
        when(cryptoIdRegistry.resolve("PEPE")).thenReturn("pepe");
        List<HistoricalDataDto> gecko = points(30);
        when(coinGeckoChartClient.fetchOhlc("pepe", "1y")).thenReturn(gecko);

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("PEPE", "1y", null, null, null);

        assertSame(gecko, result);
    }

    @Test
    void fetch_allSourcesEmpty_returnsBinanceResultAsLastResort() {
        when(yahooChartClient.fetchChartHistory(any(), any(), any(), any(), any())).thenReturn(points(0));
        List<HistoricalDataDto> binance = points(2);
        when(binanceChartClient.fetchKlines(anyString(), anyString())).thenReturn(binance);
        when(cryptoIdRegistry.resolve(anyString())).thenReturn(null);
        when(coinGeckoChartClient.fetchOhlc(any(), anyString())).thenReturn(points(0));

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("XYZ", "1y", null, null, null);

        assertSame(binance, result);
    }

    @Test
    void fetch_resolvesGeckoIdFromCleanSymbol() {
        when(yahooChartClient.fetchChartHistory(any(), any(), any(), any(), any())).thenReturn(points(0));
        when(binanceChartClient.fetchKlines(anyString(), anyString())).thenReturn(points(0));
        when(cryptoIdRegistry.resolve(anyString())).thenReturn("pepe");
        when(coinGeckoChartClient.fetchOhlc(anyString(), anyString())).thenReturn(points(7));

        // " pepe-usd " → trim + uppercase → "PEPE-USD" registry'ye gider
        strategy.fetchHistoricalData(" pepe-usd ", "1mo", null, null, null);

        verify(cryptoIdRegistry).resolve("PEPE-USD");
    }

    /**
     * Canlida yasanan hata: Yahoo uretilmis veri donduru icin "dolu" sayiliyor, kademe
     * hic ilerlemiyor ve BTC grafigi ~91 gosterirken gercek fiyat ~79.000 oluyordu.
     * Binance ve CoinGecko resmi/acik kaynaklar; Yahoo demo modundayken atlanmali.
     */
    @Test
    void skipsYahooEntirely_whenYahooServesDemoData() {
        when(dataSourcePolicy.useDemoData(anyString())).thenReturn(true);
        List<HistoricalDataDto> real = points(30);
        when(binanceChartClient.fetchKlines(anyString(), anyString())).thenReturn(real);

        List<HistoricalDataDto> result =
                strategy.fetchHistoricalData("BTC", "1mo", "1d", null, null);

        assertSame(real, result);
        verify(yahooChartClient, never()).fetchChartHistory(anyString(), anyString(), anyString(), any(), any());
    }

    /** Yahoo gercek veri verdigi ortamlarda (yerel) davranis degismemeli. */
    @Test
    void stillPrefersYahoo_whenNotInDemoMode() {
        when(dataSourcePolicy.useDemoData(anyString())).thenReturn(false);
        List<HistoricalDataDto> yahooData = points(30);
        when(yahooChartClient.fetchChartHistory(anyString(), anyString(), anyString(), any(), any()))
                .thenReturn(yahooData);

        List<HistoricalDataDto> result =
                strategy.fetchHistoricalData("BTC", "1mo", "1d", null, null);

        assertSame(yahooData, result);
        verify(binanceChartClient, never()).fetchKlines(anyString(), anyString());
    }
}
