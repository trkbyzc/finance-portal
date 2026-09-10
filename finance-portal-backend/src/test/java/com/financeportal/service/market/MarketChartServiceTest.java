package com.financeportal.service.market;

import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.service.cache.CacheService;
import com.financeportal.service.mapper.ChartMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MarketChartServiceTest {

    @Mock
    private ChartDataStrategy strategyA;

    @Mock
    private ChartDataStrategy strategyB;

    @Mock
    private CacheService cacheService;

    @Mock
    private ChartMapper chartMapper;

    private MarketChartService service;

    @BeforeEach
    void setUp() {
        service = new MarketChartService(List.of(strategyA, strategyB), cacheService, chartMapper);
    }

    // Cache hit'i bypass etmek için: getOrFetch'i çağırınca supplier'ı invoke ettiririz
    @SuppressWarnings("unchecked")
    private void wireCacheToRunSupplier() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong()))
                .thenAnswer(inv -> ((Supplier<List<HistoricalDataDto>>) inv.getArgument(1)).get());
    }

    // -------- cache key composition --------

    @Test
    @SuppressWarnings("unchecked")
    void cacheKey_includesCategoryAndCleanSymbolAndRange() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong())).thenReturn(List.of());

        service.getHistoricalDataWithEvdsFallback("akbnk", "tr_stock", "1y", "1d", null, null, 0);

        ArgumentCaptor<String> keyCap = ArgumentCaptor.forClass(String.class);
        verify(cacheService).getOrFetch(keyCap.capture(), any(), eq(5L));
        // Cache key format: hist:CATEGORY:SYMBOL:RANGE
        assertEquals("hist:TR_STOCK:AKBNK:1y", keyCap.getValue());
    }

    @Test
    @SuppressWarnings("unchecked")
    void cacheKey_nullCategory_defaultsToUnknown() {
        when(cacheService.getOrFetch(anyString(), any(Supplier.class), anyLong())).thenReturn(List.of());

        service.getHistoricalDataWithEvdsFallback("X", null, "1y", "1d", null, null, 0);

        ArgumentCaptor<String> keyCap = ArgumentCaptor.forClass(String.class);
        verify(cacheService).getOrFetch(keyCap.capture(), any(), anyLong());
        assertTrue(keyCap.getValue().startsWith("hist:UNKNOWN:"));
    }

    // -------- strategy dispatch --------

    @Test
    void strategyMatch_firstSupportingStrategyHandlesAndOthersNotCalled() {
        HistoricalDataDto bar = newBar(new BigDecimal("100"));
        when(strategyA.supports("TR_STOCK", "AKBNK")).thenReturn(true);
        when(strategyA.fetchHistoricalData(any(), any(), any(), any(), any())).thenReturn(List.of(bar));
        wireCacheToRunSupplier();

        List<HistoricalDataDto> result = service.getHistoricalDataWithEvdsFallback(
                "AKBNK", "TR_STOCK", "1y", "1d", null, null, 0);

        assertEquals(1, result.size());
        verify(strategyA).fetchHistoricalData(eq("AKBNK"), eq("1y"), eq("1d"), any(), any());
        verify(strategyB, never()).supports(anyString(), anyString());
    }

    @Test
    void strategyMatch_skipsNonSupportingStrategyAndUsesNext() {
        HistoricalDataDto bar = newBar(new BigDecimal("50"));
        when(strategyA.supports(anyString(), anyString())).thenReturn(false);
        when(strategyB.supports("CRYPTO", "BTC")).thenReturn(true);
        when(strategyB.fetchHistoricalData(any(), any(), any(), any(), any())).thenReturn(List.of(bar));
        wireCacheToRunSupplier();

        List<HistoricalDataDto> result = service.getHistoricalDataWithEvdsFallback(
                "BTC", "CRYPTO", "1y", "1d", null, null, 0);

        assertEquals(1, result.size());
        verify(strategyA, never()).fetchHistoricalData(any(), any(), any(), any(), any());
    }

    @Test
    void noStrategyMatches_returnsEmptyList() {
        when(strategyA.supports(anyString(), anyString())).thenReturn(false);
        when(strategyB.supports(anyString(), anyString())).thenReturn(false);
        wireCacheToRunSupplier();

        List<HistoricalDataDto> result = service.getHistoricalDataWithEvdsFallback(
                "X", "UNKNOWN", "1y", "1d", null, null, 0);

        assertTrue(result.isEmpty());
        verify(chartMapper, never()).calculateMovingAverage(any(), anyInt());
    }

    // -------- moving average --------

    @Test
    void maPeriodGreaterThanZero_callsChartMapper() {
        HistoricalDataDto bar = newBar(new BigDecimal("100"));
        when(strategyA.supports(anyString(), anyString())).thenReturn(true);
        when(strategyA.fetchHistoricalData(any(), any(), any(), any(), any())).thenReturn(List.of(bar));
        when(chartMapper.calculateMovingAverage(any(), eq(20))).thenReturn(List.of(bar));
        wireCacheToRunSupplier();

        service.getHistoricalDataWithEvdsFallback("X", "STOCK", "1y", "1d", null, null, 20);

        verify(chartMapper).calculateMovingAverage(any(), eq(20));
    }

    @Test
    void maPeriodZero_skipsMovingAverage() {
        HistoricalDataDto bar = newBar(new BigDecimal("100"));
        when(strategyA.supports(anyString(), anyString())).thenReturn(true);
        when(strategyA.fetchHistoricalData(any(), any(), any(), any(), any())).thenReturn(List.of(bar));
        wireCacheToRunSupplier();

        service.getHistoricalDataWithEvdsFallback("X", "STOCK", "1y", "1d", null, null, 0);

        verify(chartMapper, never()).calculateMovingAverage(any(), anyInt());
    }

    @Test
    void emptyData_skipsMovingAverage() {
        when(strategyA.supports(anyString(), anyString())).thenReturn(true);
        when(strategyA.fetchHistoricalData(any(), any(), any(), any(), any())).thenReturn(List.of());
        wireCacheToRunSupplier();

        service.getHistoricalDataWithEvdsFallback("X", "STOCK", "1y", "1d", null, null, 20);

        verify(chartMapper, never()).calculateMovingAverage(any(), anyInt());
    }

    @Test
    void nullStrategyResult_treatedAsEmpty() {
        when(strategyA.supports(anyString(), anyString())).thenReturn(true);
        when(strategyA.fetchHistoricalData(any(), any(), any(), any(), any())).thenReturn(null);
        wireCacheToRunSupplier();

        List<HistoricalDataDto> result = service.getHistoricalDataWithEvdsFallback(
                "X", "STOCK", "1y", "1d", null, null, 0);

        assertTrue(result.isEmpty());
    }

    @Test
    void symbolNull_safeAndDelegated() {
        when(strategyA.supports(anyString(), anyString())).thenReturn(false);
        when(strategyB.supports(anyString(), anyString())).thenReturn(false);
        wireCacheToRunSupplier();

        // Symbol null → "" olarak temizlenir, exception olmamalı
        List<HistoricalDataDto> result = service.getHistoricalDataWithEvdsFallback(
                null, "STOCK", "1y", "1d", null, null, 0);

        assertTrue(result.isEmpty());
    }

    private HistoricalDataDto newBar(BigDecimal close) {
        HistoricalDataDto d = new HistoricalDataDto();
        d.setClose(close);
        return d;
    }
}
