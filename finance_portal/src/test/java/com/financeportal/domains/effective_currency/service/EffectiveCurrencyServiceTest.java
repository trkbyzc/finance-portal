package com.financeportal.domains.effective_currency.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.service.cache.CacheService;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EffectiveCurrencyServiceTest {

    @Mock
    private CacheService cacheService;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOps;

    private EffectiveCurrencyService service;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        service = new EffectiveCurrencyService(cacheService, redisTemplate, objectMapper);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    // -------- getEffectiveCurrencies --------

    @Test
    void liveCurrencies_delegatesToCacheServiceWith60MinTtl() {
        when(cacheService.getOrFetch(anyString(), any(), anyLong())).thenReturn(List.of());

        service.getEffectiveCurrencies();

        verify(cacheService).getOrFetch(eq("cache:effective-currencies"), any(), eq(60L));
    }

    // -------- getEffectiveCurrencyHistorical (Map<String,Object> form) --------

    @Test
    void historical_redisEmpty_returnsEmptyList() {
        when(valueOps.get("evds:effective-currency:USD")).thenReturn(null);

        List<Map<String, Object>> result = service.getEffectiveCurrencyHistorical("USD", "1y");

        assertTrue(result.isEmpty());
    }

    @Test
    void historical_uppercasesCodeForRedisLookup() {
        when(valueOps.get("evds:effective-currency:EUR")).thenReturn("[]");

        service.getEffectiveCurrencyHistorical("eur", "5y");

        // EUR (upper) ile sorgulandı
        verify(valueOps).get("evds:effective-currency:EUR");
    }

    @Test
    void historical_filtersOutBeforeCutoff() {
        LocalDate today = LocalDate.now();
        LocalDate twoYearsAgo = today.minusYears(2);
        String json = String.format(
                "[{\"date\":\"%s\",\"close\":30.0},{\"date\":\"%s\",\"close\":35.0}]",
                twoYearsAgo, today
        );
        when(valueOps.get("evds:effective-currency:USD")).thenReturn(json);

        List<Map<String, Object>> result = service.getEffectiveCurrencyHistorical("USD", "1y");

        assertEquals(1, result.size());
        assertEquals(today.toString(), result.get(0).get("date"));
    }

    @Test
    void historical_invalidJson_returnsEmptyList() {
        when(valueOps.get("evds:effective-currency:USD")).thenReturn("garbage");

        List<Map<String, Object>> result = service.getEffectiveCurrencyHistorical("USD", "1y");

        assertTrue(result.isEmpty());
    }

    @Test
    void historical_recordWithoutDate_skipped() {
        LocalDate today = LocalDate.now();
        String json = String.format(
                "[{\"close\":30.0},{\"date\":\"%s\",\"close\":35.0}]",
                today
        );
        when(valueOps.get("evds:effective-currency:USD")).thenReturn(json);

        List<Map<String, Object>> result = service.getEffectiveCurrencyHistorical("USD", "1y");

        assertEquals(1, result.size());
    }

    // -------- getEffectiveCurrencyHistoryAsDto (HistoricalDataDto form for chart) --------

    @Test
    void historyAsDto_redisEmpty_returnsEmpty() {
        when(valueOps.get("evds:effective-currency:USD")).thenReturn(null);

        List<HistoricalDataDto> result = service.getEffectiveCurrencyHistoryAsDto("USD", "1y");

        assertTrue(result.isEmpty());
    }

    @Test
    void historyAsDto_populatesAllOHLCFromCloseSameValue() {
        LocalDate today = LocalDate.now();
        String json = String.format(
                "[{\"date\":\"%s\",\"close\":32.5}]", today);
        when(valueOps.get("evds:effective-currency:USD")).thenReturn(json);

        List<HistoricalDataDto> result = service.getEffectiveCurrencyHistoryAsDto("USD", "1y");

        assertEquals(1, result.size());
        HistoricalDataDto dto = result.get(0);
        // Line chart için OHLC hepsi aynı close değerinde
        assertEquals(0, dto.getOpen().compareTo(dto.getClose()));
        assertEquals(0, dto.getHigh().compareTo(dto.getClose()));
        assertEquals(0, dto.getLow().compareTo(dto.getClose()));
        assertEquals(0, dto.getPrice().compareTo(dto.getClose()));
        assertEquals(0L, dto.getVolume());
        assertEquals(today, dto.getDate());
    }

    @Test
    void historyAsDto_sortedByTimestampAscending() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate twoDaysAgo = today.minusDays(2);
        // Karışık sıra
        String json = String.format(
                "[{\"date\":\"%s\",\"close\":3.0},{\"date\":\"%s\",\"close\":1.0},{\"date\":\"%s\",\"close\":2.0}]",
                today, twoDaysAgo, yesterday);
        when(valueOps.get("evds:effective-currency:USD")).thenReturn(json);

        List<HistoricalDataDto> result = service.getEffectiveCurrencyHistoryAsDto("USD", "1y");

        assertEquals(3, result.size());
        // Ascending timestamp
        assertTrue(result.get(0).getTimestamp() < result.get(1).getTimestamp());
        assertTrue(result.get(1).getTimestamp() < result.get(2).getTimestamp());
    }

    @Test
    void historyAsDto_skipsRecordWithNullCloseOrDate() {
        LocalDate today = LocalDate.now();
        String json = String.format(
                "[{\"date\":null,\"close\":30.0},{\"date\":\"%s\",\"close\":null},{\"date\":\"%s\",\"close\":35.0}]",
                today, today);
        when(valueOps.get("evds:effective-currency:USD")).thenReturn(json);

        List<HistoricalDataDto> result = service.getEffectiveCurrencyHistoryAsDto("USD", "1y");

        // Null date veya null close olanlar atılır
        assertEquals(1, result.size());
    }

    @Test
    void historyAsDto_filtersByRange() {
        LocalDate today = LocalDate.now();
        LocalDate threeYearsAgo = today.minusYears(3);
        String json = String.format(
                "[{\"date\":\"%s\",\"close\":1.0},{\"date\":\"%s\",\"close\":2.0}]",
                threeYearsAgo, today);
        when(valueOps.get("evds:effective-currency:USD")).thenReturn(json);

        // 1y range — sadece bugünki kayıt
        List<HistoricalDataDto> result = service.getEffectiveCurrencyHistoryAsDto("USD", "1y");

        assertEquals(1, result.size());
        assertEquals(today, result.get(0).getDate());
    }
}
