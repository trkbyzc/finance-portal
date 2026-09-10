package com.financeportal.domains.turkish_bond.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.turkish_bond.config.TurkishBondCatalog;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.service.mapper.BondMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TurkishBondServiceExtraTest {

    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private BondMapper bondMapper;
    @Mock private TurkishBondCatalog bondCatalog;

    private TurkishBondService service;

    @BeforeEach
    void setUp() {
        service = new TurkishBondService(redisTemplate, new ObjectMapper(), bondMapper, bondCatalog);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    private TurkishBondCatalog.CatalogEntry entry(String symbol, String isin, String name, String maturity, String bucket) {
        TurkishBondCatalog.CatalogEntry e = new TurkishBondCatalog.CatalogEntry();
        e.setSymbol(symbol);
        e.setIsin(isin);
        e.setName(name);
        e.setMaturity(maturity);
        e.setBucket(bucket);
        return e;
    }

    // -------- getCategorizedBonds --------

    @Test
    void getCategorized_mapsBucketToLabelAndIncludesYield() {
        when(bondMapper.getBondYieldCurve()).thenReturn(List.of(
                Map.of("label", "Kısa Vadeli", "yield", 42.5),
                Map.of("label", "1+ Yıl", "yield", 40.0),
                Map.of("label", "10 Yıl+", "yield", 30.0)));

        when(bondCatalog.getEntries()).thenReturn(List.of(
                entry("TP.A", "A", "BondA", "2026-12-31", "SHORT"),
                entry("TP.B", "B", "BondB", "2027-12-31", "Y1"),
                entry("TP.C", "C", "BondC", "2035-12-31", "Y10")));

        List<Map<String, Object>> result = service.getCategorizedBonds();

        assertEquals(3, result.size());
        // SHORT → Kısa Vadeli → 42.5
        assertEquals("Kısa Vadeli", result.get(0).get("label"));
        assertEquals(42.5, result.get(0).get("yield"));
        // Y10 → 10 Yıl+ → 30.0
        assertEquals("10 Yıl+", result.get(2).get("label"));
        assertEquals(30.0, result.get(2).get("yield"));
    }

    @Test
    void getCategorized_bucketNotInMap_emptyLabel() {
        when(bondMapper.getBondYieldCurve()).thenReturn(List.of());
        when(bondMapper.getFallbackYieldCurve()).thenReturn(List.of());

        when(bondCatalog.getEntries()).thenReturn(List.of(
                entry("TP.X", "X", "Unknown", "2030-06-01", "UNKNOWN")));

        List<Map<String, Object>> result = service.getCategorizedBonds();

        assertEquals(1, result.size());
        // UNKNOWN bucket → empty label
        assertEquals("", result.get(0).get("label"));
    }

    @Test
    void getCategorized_noMatchingYield_omitsYieldKey() {
        when(bondMapper.getBondYieldCurve()).thenReturn(List.of()); // boş yieldCurve
        when(bondMapper.getFallbackYieldCurve()).thenReturn(List.of()); // boş fallback bile

        when(bondCatalog.getEntries()).thenReturn(List.of(
                entry("TP.A", "A", "BondA", "2026-12-31", "SHORT")));

        List<Map<String, Object>> result = service.getCategorizedBonds();
        // Yield map'te yok → "yield" key'i set edilmez
        assertFalse(result.get(0).containsKey("yield"));
    }

    @Test
    void getCategorized_emptyCatalog_returnsEmpty() {
        when(bondMapper.getBondYieldCurve()).thenReturn(List.of(Map.of("label", "Kısa Vadeli", "yield", 42.5)));
        when(bondCatalog.getEntries()).thenReturn(List.of());

        assertTrue(service.getCategorizedBonds().isEmpty());
    }

    @Test
    void getCategorized_yieldNotNumber_omitsFromMap() {
        when(bondMapper.getBondYieldCurve()).thenReturn(List.of(
                Map.of("label", "Kısa Vadeli", "yield", "not-a-number")));
        when(bondCatalog.getEntries()).thenReturn(List.of(
                entry("TP.A", "A", "BondA", "2026-12-31", "SHORT")));

        List<Map<String, Object>> result = service.getCategorizedBonds();
        // String yield filtre edilir, yield key set edilmez
        assertFalse(result.get(0).containsKey("yield"));
    }

    @Test
    void getCategorized_bondMapperLabelNull_skipped() {
        Map<String, Object> withNullLabel = new java.util.HashMap<>();
        withNullLabel.put("label", null);
        withNullLabel.put("yield", 30.0);
        when(bondMapper.getBondYieldCurve()).thenReturn(List.of(withNullLabel));
        when(bondCatalog.getEntries()).thenReturn(List.of(
                entry("TP.A", "A", "BondA", "2026-12-31", "SHORT")));

        List<Map<String, Object>> result = service.getCategorizedBonds();
        // Null label → yield map'e eklenmez
        assertFalse(result.get(0).containsKey("yield"));
    }

    @Test
    void getCategorized_yieldIsInteger_includedAsDouble() {
        when(bondMapper.getBondYieldCurve()).thenReturn(List.of(
                Map.of("label", "Kısa Vadeli", "yield", 42))); // int
        when(bondCatalog.getEntries()).thenReturn(List.of(
                entry("TP.A", "A", "BondA", "2026-12-31", "SHORT")));

        List<Map<String, Object>> result = service.getCategorizedBonds();
        assertEquals(42.0, result.get(0).get("yield"));
    }

    // -------- benchmarkKeyForBondSymbol (via fetchBondHistoryFromRedis) --------

    @Test
    void history_catalogBondWithMaturityIn1m_usesBenchmark1m() {
        // ISIN format: TPTRTDDMMYYxxx — vade 6 ay sonra
        LocalDate sixMonthsFromNow = LocalDate.now().plusMonths(6);
        String isin = String.format("%02d%02d%02d",
                sixMonthsFromNow.getDayOfMonth(),
                sixMonthsFromNow.getMonthValue(),
                sixMonthsFromNow.getYear() % 100);
        String symbol = "TP.TRT" + isin + "K10";

        // Custom symbol → benchmark fallback
        when(valueOps.get("evds:history:" + symbol)).thenReturn(null);
        when(valueOps.get("evds:benchmark:1m")).thenReturn(
                String.format("[{\"date\":\"%s\",\"rate\":42.0}]", LocalDate.now()));

        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis(symbol);

        assertEquals(1, result.size());
    }

    @Test
    void history_catalogBondWithMaturityIn5y_usesBenchmark5y() {
        // Vade ~6 yıl sonra → 5y+ kovasına denk gelir (5y benchmark)
        LocalDate sixYearsFromNow = LocalDate.now().plusYears(6);
        String isin = String.format("%02d%02d%02d",
                sixYearsFromNow.getDayOfMonth(),
                sixYearsFromNow.getMonthValue(),
                sixYearsFromNow.getYear() % 100);
        String symbol = "TP.TRT" + isin + "K10";

        when(valueOps.get("evds:history:" + symbol)).thenReturn(null);
        when(valueOps.get("evds:benchmark:5y")).thenReturn(
                String.format("[{\"date\":\"%s\",\"rate\":30.0}]", LocalDate.now()));

        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis(symbol);
        assertEquals(1, result.size());
    }

    @Test
    void history_catalogBondWithMaturityIn10y_usesBenchmark10y() {
        // 10 yıl sonra
        LocalDate tenYears = LocalDate.now().plusYears(10);
        String isin = String.format("%02d%02d%02d",
                tenYears.getDayOfMonth(),
                tenYears.getMonthValue(),
                tenYears.getYear() % 100);
        String symbol = "TP.TRT" + isin + "K10";

        when(valueOps.get("evds:history:" + symbol)).thenReturn(null);
        when(valueOps.get("evds:benchmark:10y")).thenReturn(
                String.format("[{\"date\":\"%s\",\"rate\":25.0}]", LocalDate.now()));

        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis(symbol);
        assertEquals(1, result.size());
    }

    @Test
    void history_symbolPastMaturity_returnsEmpty() {
        // Geçmişte vade → benchmark hesaplaması null döner, fallback yok → empty
        String pastIsin = "010120"; // 01-01-2020
        String symbol = "TP.TRT" + pastIsin + "K10";

        when(valueOps.get("evds:history:" + symbol)).thenReturn(null);

        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis(symbol);
        assertTrue(result.isEmpty());
    }

    @Test
    void history_isinTooShort_returnsEmpty() {
        String symbol = "TP.SHORT";
        when(valueOps.get("evds:history:TP.SHORT")).thenReturn(null);

        assertTrue(service.fetchBondHistoryFromRedis(symbol).isEmpty());
    }

    @Test
    void history_invalidIsinFormat_returnsEmpty() {
        // ISIN has alpha where numbers expected
        String symbol = "TP.TRTABCDEFG";
        when(valueOps.get("evds:history:" + symbol)).thenReturn(null);

        assertTrue(service.fetchBondHistoryFromRedis(symbol).isEmpty());
    }

    @Test
    void history_directRedisHit_skipsBenchmark() {
        // Symbol has direct history → no fallback to benchmark
        String symbol = "TP.X.CUSTOM";
        when(valueOps.get("evds:history:" + symbol)).thenReturn(
                String.format("[{\"date\":\"%s\",\"rate\":15.0}]", LocalDate.now()));

        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis(symbol);

        assertEquals(1, result.size());
        // Benchmark hiç sorgulanmaz
        org.mockito.Mockito.verify(valueOps, org.mockito.Mockito.never()).get("evds:benchmark:1m");
    }
}
