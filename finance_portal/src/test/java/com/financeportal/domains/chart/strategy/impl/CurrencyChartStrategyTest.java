package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.client.yahoo.YahooChartClient;
import com.financeportal.domains.currency.client.TcmbIntegrationClient;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.domains.currency.service.CurrencyService;
import com.financeportal.model.dto.market.HistoricalDataDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings({"unchecked", "rawtypes"})
class CurrencyChartStrategyTest {

    @Mock private YahooChartClient yahooClient;
    @Mock private TcmbIntegrationClient tcmbClient;
    @Mock private CurrencyService currencyService;

    @InjectMocks private CurrencyChartStrategy strategy;

    // -------- supports() --------

    @Test
    void supports_currencyCategory_true() {
        assertTrue(strategy.supports("CURRENCY", "USD"));
        assertTrue(strategy.supports("currency", "USD"));
    }

    @Test
    void supports_otherCategory_false() {
        assertFalse(strategy.supports("STOCK", "USD"));
        assertFalse(strategy.supports(null, "USD"));
    }

    // -------- fetchHistoricalData (EVDS path) --------

    @Test
    void fetch_evdsHasData_returnsItPatchedWithLiveRate() {
        // 10 nokta var, son nokta bugün
        List<HistoricalDataDto> evdsData = new ArrayList<>();
        for (int i = 9; i > 0; i--) evdsData.add(bar(LocalDate.now().minusDays(i), 33.0));
        evdsData.add(bar(LocalDate.now(), 34.0));

        when(tcmbClient.fetchCurrencyHistoryFromRedis(eq("USD"), anyString(), any(), any())).thenReturn(evdsData);

        CurrencyDto usd = new CurrencyDto();
        usd.setCurrencyCode("USD");
        usd.setForexSelling(new BigDecimal("34.55"));
        when(currencyService.getCurrencyRates()).thenReturn(List.of(usd));

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("USD=X", "5y", "1d", null, null);

        // Son nokta canlı kur ile değiştirildi
        assertEquals(new BigDecimal("34.55"), result.get(result.size() - 1).getClose());
        verify(yahooClient, never()).fetchChartHistory(any(), any(), any(), any(), any());
    }

    @Test
    void fetch_evdsSparseButNotEmpty_usesEvdsNotYahoo() {
        // Eskiden "< 5 nokta" Yahoo'ya düşürürdü; artık az nokta da olsa EVDS kullanılır (kaynak
        // tutarlılığı — grafik son noktası header'daki TCMB canlı fiyatıyla eşleşsin). Sadece EVDS
        // tamamen boşsa Yahoo'ya düşeriz.
        List<HistoricalDataDto> sparse = new ArrayList<>();
        sparse.add(bar(LocalDate.now().minusDays(1), 33.0));
        when(tcmbClient.fetchCurrencyHistoryFromRedis(anyString(), anyString(), any(), any())).thenReturn(sparse);

        CurrencyDto usd = new CurrencyDto();
        usd.setCurrencyCode("USD");
        usd.setForexSelling(new BigDecimal("34.55"));
        when(currencyService.getCurrencyRates()).thenReturn(List.of(usd));

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("USD", "1y", "1d", null, null);

        // Yahoo'ya düşmedi; EVDS + canlı patch kullanıldı (son nokta canlı kura çekildi).
        verify(yahooClient, never()).fetchChartHistory(any(), any(), any(), any(), any());
        assertEquals(new BigDecimal("34.55"), result.get(result.size() - 1).getClose());
    }

    @Test
    void fetch_evdsNull_yahooFallback() {
        when(tcmbClient.fetchCurrencyHistoryFromRedis(anyString(), anyString(), any(), any())).thenReturn(null);
        when(yahooClient.fetchChartHistory(anyString(), anyString(), anyString(), any(), any()))
                .thenReturn(List.of());

        strategy.fetchHistoricalData("USD", "1y", "1d", null, null);

        verify(yahooClient).fetchChartHistory(anyString(), anyString(), anyString(), any(), any());
    }

    @Test
    void fetch_evdsEmpty_yahooFallback() {
        when(tcmbClient.fetchCurrencyHistoryFromRedis(anyString(), anyString(), any(), any())).thenReturn(List.of());
        when(yahooClient.fetchChartHistory(anyString(), anyString(), anyString(), any(), any()))
                .thenReturn(List.of());

        strategy.fetchHistoricalData("EUR", "1y", "1d", null, null);

        verify(yahooClient).fetchChartHistory(eq("EURTRY=X"), anyString(), anyString(), any(), any());
    }

    @Test
    void fetch_symbolAlreadyHasEqualsX_passesThrough() {
        when(tcmbClient.fetchCurrencyHistoryFromRedis(anyString(), anyString(), any(), any())).thenReturn(List.of());
        when(yahooClient.fetchChartHistory(anyString(), anyString(), anyString(), any(), any())).thenReturn(List.of());

        strategy.fetchHistoricalData("USDTRY=X", "1y", "1d", null, null);

        // =X içeriyor, "USDTRY=X" olarak Yahoo'ya geçer (suffix eklenmez)
        verify(yahooClient).fetchChartHistory(eq("USDTRY=X"), anyString(), anyString(), any(), any());
    }

    // -------- patchLastPointWithLiveRate --------

    @Test
    void patch_lastPointToday_overwritesWithLiveRate() {
        List<HistoricalDataDto> data = new ArrayList<>();
        for (int i = 9; i > 0; i--) data.add(bar(LocalDate.now().minusDays(i), 33.0));
        data.add(bar(LocalDate.now(), 34.0));
        when(tcmbClient.fetchCurrencyHistoryFromRedis(anyString(), anyString(), any(), any())).thenReturn(data);

        CurrencyDto usd = new CurrencyDto();
        usd.setCurrencyCode("USD");
        usd.setForexSelling(new BigDecimal("35"));
        when(currencyService.getCurrencyRates()).thenReturn(List.of(usd));

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("USD", "1y", "1d", null, null);

        // Son nokta bugün ve 35'e güncellendi
        HistoricalDataDto last = result.get(result.size() - 1);
        assertEquals(new BigDecimal("35"), last.getClose());
        assertEquals(new BigDecimal("35"), last.getOpen());
        assertEquals(LocalDate.now(), last.getDate());
    }

    @Test
    void patch_lastPointOlderThanToday_appendsNewToday() {
        List<HistoricalDataDto> data = new ArrayList<>();
        for (int i = 9; i > 0; i--) data.add(bar(LocalDate.now().minusDays(i), 33.0));
        // Yeterli (≥5) nokta ama son nokta dün
        when(tcmbClient.fetchCurrencyHistoryFromRedis(anyString(), anyString(), any(), any())).thenReturn(data);

        CurrencyDto usd = new CurrencyDto();
        usd.setCurrencyCode("USD");
        usd.setForexSelling(new BigDecimal("35"));
        when(currencyService.getCurrencyRates()).thenReturn(List.of(usd));

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("USD", "1y", "1d", null, null);

        // Yeni bir nokta eklendi (bugün)
        assertEquals(LocalDate.now(), result.get(result.size() - 1).getDate());
        assertEquals(new BigDecimal("35"), result.get(result.size() - 1).getClose());
    }

    @Test
    void patch_linkedHashMapRates_extractsForexSelling() {
        List<HistoricalDataDto> data = new ArrayList<>();
        for (int i = 9; i > 0; i--) data.add(bar(LocalDate.now().minusDays(i), 33.0));
        data.add(bar(LocalDate.now(), 34.0));
        when(tcmbClient.fetchCurrencyHistoryFromRedis(anyString(), anyString(), any(), any())).thenReturn(data);

        LinkedHashMap<String, Object> usdMap = new LinkedHashMap<>();
        usdMap.put("currencyCode", "USD");
        usdMap.put("forexSelling", "35.50"); // String formatında
        when(currencyService.getCurrencyRates()).thenReturn((List) List.of(usdMap));

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("USD", "1y", "1d", null, null);

        // String "35.50" → BigDecimal'a parse + son nokta patch
        assertEquals(new BigDecimal("35.50"), result.get(result.size() - 1).getClose());
    }

    @Test
    void patch_currencyServiceReturnsNull_dataReturnedUnpatched() {
        List<HistoricalDataDto> data = new ArrayList<>();
        for (int i = 9; i > 0; i--) data.add(bar(LocalDate.now().minusDays(i), 33.0));
        data.add(bar(LocalDate.now(), 34.0));
        when(tcmbClient.fetchCurrencyHistoryFromRedis(anyString(), anyString(), any(), any())).thenReturn(data);
        when(currencyService.getCurrencyRates()).thenReturn(null);

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("USD", "1y", "1d", null, null);

        // Patch yapamadı, son nokta original
        assertEquals(new BigDecimal("34.0"), result.get(result.size() - 1).getClose());
    }

    @Test
    void patch_currencyCodeNotInRates_dataReturnedUnpatched() {
        List<HistoricalDataDto> data = new ArrayList<>();
        for (int i = 9; i > 0; i--) data.add(bar(LocalDate.now().minusDays(i), 33.0));
        data.add(bar(LocalDate.now(), 34.0));
        when(tcmbClient.fetchCurrencyHistoryFromRedis(anyString(), anyString(), any(), any())).thenReturn(data);
        CurrencyDto eur = new CurrencyDto();
        eur.setCurrencyCode("EUR");
        eur.setForexSelling(new BigDecimal("37"));
        when(currencyService.getCurrencyRates()).thenReturn(List.of(eur));

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("USD", "1y", "1d", null, null);
        // USD yok rates listede, patch atlanır
        assertEquals(new BigDecimal("34.0"), result.get(result.size() - 1).getClose());
    }

    @Test
    void patch_currencyServiceThrows_swallowsAndReturnsData() {
        List<HistoricalDataDto> data = new ArrayList<>();
        for (int i = 9; i > 0; i--) data.add(bar(LocalDate.now().minusDays(i), 33.0));
        data.add(bar(LocalDate.now(), 34.0));
        when(tcmbClient.fetchCurrencyHistoryFromRedis(anyString(), anyString(), any(), any())).thenReturn(data);
        when(currencyService.getCurrencyRates()).thenThrow(new RuntimeException("down"));

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("USD", "1y", "1d", null, null);

        assertEquals(10, result.size());
    }

    // -------- helper --------

    private HistoricalDataDto bar(LocalDate date, double close) {
        HistoricalDataDto dto = new HistoricalDataDto();
        dto.setDate(date);
        dto.setClose(BigDecimal.valueOf(close));
        dto.setPrice(BigDecimal.valueOf(close));
        return dto;
    }
}
