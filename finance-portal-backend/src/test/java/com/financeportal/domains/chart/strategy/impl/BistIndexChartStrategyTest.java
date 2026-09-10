package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.domains.stock.client.BistStockClient;
import com.financeportal.model.dto.market.HistoricalDataDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BistIndexChartStrategyTest {

    @Mock
    private BistStockClient bistStockClient;

    @InjectMocks
    private BistIndexChartStrategy strategy;

    @Test
    void supports_trIndexCategory_returnsTrue() {
        assertTrue(strategy.supports("TR_INDEX", "XU100"));
    }

    @Test
    void supports_trIndexLowerCase_returnsTrue() {
        // equalsIgnoreCase
        assertTrue(strategy.supports("tr_index", "XU100"));
    }

    @Test
    void supports_otherCategory_returnsFalse() {
        assertFalse(strategy.supports("TR_STOCK", "AKBNK"));
        assertFalse(strategy.supports("CRYPTO", "BTC"));
        assertFalse(strategy.supports("", "X"));
        assertFalse(strategy.supports(null, "X"));
    }

    @Test
    void fetchHistoricalData_stripsIsSuffix_andDelegatesToClient() {
        when(bistStockClient.fetchIndexHistory(anyString(), anyString())).thenReturn(List.of());

        strategy.fetchHistoricalData("XU100.IS", "1y", "1d", null, null);

        ArgumentCaptor<String> symbolCaptor = ArgumentCaptor.forClass(String.class);
        verify(bistStockClient).fetchIndexHistory(symbolCaptor.capture(), anyString());
        // .IS suffix temizlendi, sadece XU100 client'a gitti
        assertEquals("XU100", symbolCaptor.getValue());
    }

    @Test
    void fetchHistoricalData_uppercasesAndTrimsSymbol() {
        when(bistStockClient.fetchIndexHistory(anyString(), anyString())).thenReturn(List.of());

        strategy.fetchHistoricalData(" xu030 ", "5y", "1d", null, null);

        ArgumentCaptor<String> symbolCaptor = ArgumentCaptor.forClass(String.class);
        verify(bistStockClient).fetchIndexHistory(symbolCaptor.capture(), anyString());
        assertEquals("XU030", symbolCaptor.getValue());
    }

    @Test
    void fetchHistoricalData_returnsClientResult() {
        List<HistoricalDataDto> expected = List.of(
                new HistoricalDataDto(),
                new HistoricalDataDto()
        );
        when(bistStockClient.fetchIndexHistory("XU100", "1y")).thenReturn(expected);

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("XU100", "1y", "1d", null, null);

        assertEquals(2, result.size());
    }
}
