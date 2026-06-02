package com.financeportal.domains.turkish_bond.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TurkishBondServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOps;

    @Mock
    private BondMapper bondMapper;

    @Mock
    private TurkishBondCatalog bondCatalog;

    private TurkishBondService service;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        service = new TurkishBondService(redisTemplate, objectMapper, bondMapper, bondCatalog);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    // -------- getTurkishBonds (yield curve dispatcher) --------

    @Test
    void getTurkishBonds_curveNonEmpty_returnsLiveCurve() {
        Map<String, Object> live = Map.of("symbol", "TP.X", "yield", 30.5);
        when(bondMapper.getBondYieldCurve()).thenReturn(List.of(live));

        List<Map<String, Object>> result = service.getTurkishBonds();

        assertEquals(1, result.size());
        assertEquals("TP.X", result.get(0).get("symbol"));
        // Fallback'e gitmedi
        org.mockito.Mockito.verify(bondMapper, org.mockito.Mockito.never()).getFallbackYieldCurve();
    }

    @Test
    void getTurkishBonds_curveEmpty_fallsBackToFallbackCurve() {
        when(bondMapper.getBondYieldCurve()).thenReturn(List.of());
        Map<String, Object> fallback = Map.of("symbol", "FAL.X", "yield", 15.0);
        when(bondMapper.getFallbackYieldCurve()).thenReturn(List.of(fallback));

        List<Map<String, Object>> result = service.getTurkishBonds();

        assertEquals(1, result.size());
        assertEquals("FAL.X", result.get(0).get("symbol"));
    }

    // -------- fetchBondHistoryFromRedis (symbol → Redis key routing) --------

    @Test
    void history_knownSymbol1m_usesBenchmarkKey() {
        LocalDate today = LocalDate.now();
        String json = String.format("[{\"date\":\"%s\",\"rate\":40.5}]", today);
        when(valueOps.get("evds:benchmark:1m")).thenReturn(json);

        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis("TP.TRT080726K46.ORAN");

        assertEquals(1, result.size());
        // OHLC hepsi rate ile dolu
        assertEquals(0, result.get(0).getClose().compareTo(java.math.BigDecimal.valueOf(40.5).setScale(4, java.math.RoundingMode.HALF_UP)));
    }

    @Test
    void history_knownSymbol10y_usesBenchmark10yKey() {
        LocalDate today = LocalDate.now();
        String json = String.format("[{\"date\":\"%s\",\"rate\":35.0}]", today);
        when(valueOps.get("evds:benchmark:10y")).thenReturn(json);

        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis("TP.TRT050935A14.ORAN");

        assertEquals(1, result.size());
    }

    @Test
    void history_unknownTpSymbol_usesHistoryPrefix() {
        LocalDate today = LocalDate.now();
        String json = String.format("[{\"date\":\"%s\",\"rate\":18.0}]", today);
        when(valueOps.get("evds:history:TP.CUSTOM.X")).thenReturn(json);

        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis("TP.CUSTOM.X");

        assertEquals(1, result.size());
    }

    @Test
    void history_symbolNotStartingWithTp_returnsEmpty() {
        // null Redis key → empty list
        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis("UNKNOWN");

        assertTrue(result.isEmpty());
    }

    @Test
    void history_redisEmpty_returnsEmpty() {
        when(valueOps.get("evds:benchmark:1m")).thenReturn(null);

        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis("TP.TRT080726K46.ORAN");

        assertTrue(result.isEmpty());
    }

    @Test
    void history_useCloseFieldAsRateFallback() {
        LocalDate today = LocalDate.now();
        // "rate" yok ama "close" var — fallback'e düşmeli
        String json = String.format("[{\"date\":\"%s\",\"close\":22.5}]", today);
        when(valueOps.get("evds:benchmark:1m")).thenReturn(json);

        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis("TP.TRT080726K46.ORAN");

        assertEquals(1, result.size());
        assertNotNull(result.get(0).getClose());
    }

    @Test
    void history_invalidJson_returnsEmpty() {
        when(valueOps.get("evds:benchmark:1m")).thenReturn("garbage");

        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis("TP.TRT080726K46.ORAN");

        assertTrue(result.isEmpty());
    }

    @Test
    void history_skipsRecordsWithNullDateOrRate() {
        LocalDate today = LocalDate.now();
        String json = String.format(
                "[{\"close\":1.0},{\"date\":\"%s\",\"rate\":null},{\"date\":\"%s\",\"rate\":18.0}]",
                today, today
        );
        when(valueOps.get("evds:benchmark:1m")).thenReturn(json);

        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis("TP.TRT080726K46.ORAN");

        assertEquals(1, result.size());
    }

    @Test
    void history_sortedByTimestampAscending() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate twoDaysAgo = today.minusDays(2);
        // Karışık sıra
        String json = String.format(
                "[{\"date\":\"%s\",\"rate\":3.0},{\"date\":\"%s\",\"rate\":1.0},{\"date\":\"%s\",\"rate\":2.0}]",
                today, twoDaysAgo, yesterday);
        when(valueOps.get("evds:benchmark:1m")).thenReturn(json);

        List<HistoricalDataDto> result = service.fetchBondHistoryFromRedis("TP.TRT080726K46.ORAN");

        assertEquals(3, result.size());
        assertTrue(result.get(0).getTimestamp() < result.get(1).getTimestamp());
        assertTrue(result.get(1).getTimestamp() < result.get(2).getTimestamp());
    }
}
