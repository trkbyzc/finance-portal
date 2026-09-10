package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.domains.eurobond.client.BusinessInsiderBondClient;
import com.financeportal.domains.eurobond.service.EurobondService;
import com.financeportal.model.dto.market.HistoricalDataDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EurobondChartStrategyTest {

    @Mock
    private EurobondService eurobondService;
    @Mock
    private BusinessInsiderBondClient client;

    @InjectMocks
    private EurobondChartStrategy strategy;

    @Test
    void supports_eurobondCategory_caseInsensitive() {
        assertTrue(strategy.supports("EUROBOND", "US900123DV94"));
        assertTrue(strategy.supports("eurobond", "X"));
        assertFalse(strategy.supports("CRYPTO", "BTC"));
        assertFalse(strategy.supports(null, "X"));
    }

    @Test
    void fetch_resolvesTkData_andDelegatesToClient() {
        List<HistoricalDataDto> expected = List.of(new HistoricalDataDto(), new HistoricalDataDto());
        when(eurobondService.resolveTkData("US900123DV94")).thenReturn("1,155688342,1330,333");
        when(client.fetchChart("1,155688342,1330,333", "1y")).thenReturn(expected);

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("US900123DV94", "1y", "1d", null, null);

        assertSame(expected, result);
    }

    @Test
    void fetch_unknownSymbol_returnsEmpty_skipsClient() {
        when(eurobondService.resolveTkData(anyString())).thenReturn(null);

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("UNKNOWN", "1y", "1d", null, null);

        assertTrue(result.isEmpty());
        verify(client, never()).fetchChart(anyString(), anyString());
    }
}
