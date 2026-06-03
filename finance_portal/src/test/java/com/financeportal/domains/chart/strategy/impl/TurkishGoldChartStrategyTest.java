package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.client.yahoo.YahooChartClient;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TurkishGoldChartStrategyTest {

    @Mock private YahooChartClient yahooClient;

    @InjectMocks private TurkishGoldChartStrategy strategy;

    // -------- supports() --------

    @Test
    void supports_nonCommodityCategory_false() {
        assertFalse(strategy.supports("STOCK", "GRAM_ALTIN"));
        assertFalse(strategy.supports(null, "GRAM_ALTIN"));
        assertFalse(strategy.supports("COMMODITY", null));
    }

    @Test
    void supports_gramAltinVariants_true() {
        assertTrue(strategy.supports("COMMODITY", "GRAM_ALTIN"));
        assertTrue(strategy.supports("COMMODITY", "gram_altin"));
        assertTrue(strategy.supports("COMMODITY", "CEYREK_ALTIN"));
        assertTrue(strategy.supports("COMMODITY", "TAM_ALTIN"));
        assertTrue(strategy.supports("COMMODITY", "GRAM_HAS_ALTIN"));
        assertTrue(strategy.supports("COMMODITY", "CUMHURIYET_ALTINI"));
    }

    @Test
    void supports_turkishCharactersNormalized() {
        // 'İ' / 'ı' → 'I' normalize
        assertTrue(strategy.supports("COMMODITY", "GRAM_ALTİN"));
        assertTrue(strategy.supports("COMMODITY", "gram_altın"));
    }

    @Test
    void supports_bilezikContains_true() {
        assertTrue(strategy.supports("COMMODITY", "22_BILEZIK"));
        assertTrue(strategy.supports("COMMODITY", "BILEZIK"));
    }

    @Test
    void supports_nonGoldCommodity_false() {
        assertFalse(strategy.supports("COMMODITY", "GC=F"));    // pure oz gold
        assertFalse(strategy.supports("COMMODITY", "CL=F"));    // crude oil
        assertFalse(strategy.supports("COMMODITY", "BAKIR"));
    }

    // -------- fetchHistoricalData --------

    @Test
    void fetch_gcfEmpty_returnsEmpty() {
        when(yahooClient.fetchChartHistory(eq("GC=F"), anyString(), anyString(), any(), any())).thenReturn(List.of());

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("GRAM_ALTIN", "1y", "1d", null, null);

        assertTrue(result.isEmpty());
    }

    @Test
    void fetch_gcfNull_returnsEmpty() {
        when(yahooClient.fetchChartHistory(eq("GC=F"), anyString(), anyString(), any(), any())).thenReturn(null);

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("GRAM_ALTIN", "1y", "1d", null, null);

        assertTrue(result.isEmpty());
    }

    @Test
    void fetch_usdEmpty_returnsEmpty() {
        when(yahooClient.fetchChartHistory(eq("GC=F"), anyString(), anyString(), any(), any()))
                .thenReturn(List.of(bar(LocalDate.now(), 2400)));
        when(yahooClient.fetchChartHistory(eq("USDTRY=X"), anyString(), anyString(), any(), any())).thenReturn(List.of());

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("GRAM_ALTIN", "1y", "1d", null, null);

        assertTrue(result.isEmpty());
    }

    @Test
    void fetch_usdAllZeroClose_returnsEmpty() {
        when(yahooClient.fetchChartHistory(eq("GC=F"), anyString(), anyString(), any(), any()))
                .thenReturn(List.of(bar(LocalDate.now(), 2400)));
        // USD data var ama close=0 → map'e eklenmez
        when(yahooClient.fetchChartHistory(eq("USDTRY=X"), anyString(), anyString(), any(), any()))
                .thenReturn(List.of(bar(LocalDate.now(), 0)));

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("GRAM_ALTIN", "1y", "1d", null, null);

        assertTrue(result.isEmpty());
    }

    @Test
    void fetch_synthesizesGramGoldTRY_correctly() {
        LocalDate d = LocalDate.now();
        when(yahooClient.fetchChartHistory(eq("GC=F"), anyString(), anyString(), any(), any()))
                .thenReturn(List.of(bar(d, 3110)));  // 3110 USD/oz
        when(yahooClient.fetchChartHistory(eq("USDTRY=X"), anyString(), anyString(), any(), any()))
                .thenReturn(List.of(bar(d, 40)));    // 40 TRY/USD

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("GRAM_ALTIN", "1y", "1d", null, null);

        // gram_gold_TRY = 3110 × 40 / 31.1034768 ≈ 4001.1854 TRY
        assertEquals(1, result.size());
        HistoricalDataDto point = result.get(0);
        BigDecimal expected = new BigDecimal("3110").multiply(new BigDecimal("40"))
                .divide(new BigDecimal("31.1034768"), 4, java.math.RoundingMode.HALF_UP);
        assertEquals(0, expected.compareTo(point.getClose()));
        assertEquals(d, point.getDate());
        assertEquals(0L, point.getVolume());
    }

    @Test
    void fetch_missingUsdForGcfDate_usesLastKnown() {
        LocalDate d1 = LocalDate.now().minusDays(2);
        LocalDate d2 = LocalDate.now().minusDays(1);
        LocalDate d3 = LocalDate.now();
        when(yahooClient.fetchChartHistory(eq("GC=F"), anyString(), anyString(), any(), any()))
                .thenReturn(List.of(bar(d1, 2400), bar(d2, 2410), bar(d3, 2420)));
        // USDTRY sadece d1'de tanımlı, d2 ve d3'te yok
        when(yahooClient.fetchChartHistory(eq("USDTRY=X"), anyString(), anyString(), any(), any()))
                .thenReturn(List.of(bar(d1, 35)));

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("GRAM_ALTIN", "1y", "1d", null, null);

        // d1 mevcut, d2 ve d3 last-known (35) ile sentezlendi
        assertEquals(3, result.size());
        assertNotNull(result.get(2).getClose());
    }

    @Test
    void fetch_gcfPointWithoutDate_skipped() {
        LocalDate d = LocalDate.now();
        HistoricalDataDto noDate = bar(null, 2400);
        when(yahooClient.fetchChartHistory(eq("GC=F"), anyString(), anyString(), any(), any()))
                .thenReturn(List.of(noDate, bar(d, 2410)));
        when(yahooClient.fetchChartHistory(eq("USDTRY=X"), anyString(), anyString(), any(), any()))
                .thenReturn(List.of(bar(d, 35)));

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("GRAM_ALTIN", "1y", "1d", null, null);

        // İlk noktanın date'i null, atlandı
        assertEquals(1, result.size());
    }

    @Test
    void fetch_gcfPointWithZeroClose_skipped() {
        LocalDate d = LocalDate.now();
        when(yahooClient.fetchChartHistory(eq("GC=F"), anyString(), anyString(), any(), any()))
                .thenReturn(List.of(bar(d, 0), bar(d.minusDays(1), 2400)));
        when(yahooClient.fetchChartHistory(eq("USDTRY=X"), anyString(), anyString(), any(), any()))
                .thenReturn(List.of(bar(d.minusDays(1), 35)));

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("GRAM_ALTIN", "1y", "1d", null, null);

        // 0-close atlandı, sadece dün hesaplandı
        assertEquals(1, result.size());
    }

    @Test
    void fetch_OHLCAllEqualToCalculatedTRY() {
        LocalDate d = LocalDate.now();
        when(yahooClient.fetchChartHistory(eq("GC=F"), anyString(), anyString(), any(), any()))
                .thenReturn(List.of(bar(d, 2400)));
        when(yahooClient.fetchChartHistory(eq("USDTRY=X"), anyString(), anyString(), any(), any()))
                .thenReturn(List.of(bar(d, 35)));

        List<HistoricalDataDto> result = strategy.fetchHistoricalData("GRAM_ALTIN", "1y", "1d", null, null);

        HistoricalDataDto p = result.get(0);
        // Line chart için OHLC hepsi aynı
        assertEquals(0, p.getOpen().compareTo(p.getClose()));
        assertEquals(0, p.getHigh().compareTo(p.getClose()));
        assertEquals(0, p.getLow().compareTo(p.getClose()));
        assertEquals(0, p.getPrice().compareTo(p.getClose()));
    }

    private HistoricalDataDto bar(LocalDate date, double close) {
        HistoricalDataDto dto = new HistoricalDataDto();
        dto.setDate(date);
        dto.setClose(BigDecimal.valueOf(close));
        dto.setTimestamp(date != null ? date.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli() : 0L);
        return dto;
    }
}
