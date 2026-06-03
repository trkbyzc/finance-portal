package com.financeportal.domains.currency.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.model.dto.market.HistoricalDataDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TcmbIntegrationClientTest {

    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;

    private TcmbIntegrationClient client;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        client = new TcmbIntegrationClient(redisTemplate, objectMapper);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    // -------- fetchCurrencyHistoryFromRedis --------

    @Test
    void history_codeWithTRYEqX_strippedToBase() {
        when(valueOps.get("evds:currency:USD")).thenReturn("[]");

        client.fetchCurrencyHistoryFromRedis("USDTRY=X", "5y");

        // "USDTRY=X" → "USD"
        org.mockito.Mockito.verify(valueOps).get("evds:currency:USD");
    }

    @Test
    void history_lowerCaseCode_uppercased() {
        when(valueOps.get("evds:currency:EUR")).thenReturn("[]");

        client.fetchCurrencyHistoryFromRedis("eur", "1y");

        org.mockito.Mockito.verify(valueOps).get("evds:currency:EUR");
    }

    @org.junit.jupiter.params.ParameterizedTest(name = "redis returns [{0}] → empty list")
    @org.junit.jupiter.params.provider.NullSource
    @org.junit.jupiter.params.provider.ValueSource(strings = {"", "not json"})
    void history_invalidRedisPayloads_returnEmpty(String redisValue) {
        when(valueOps.get("evds:currency:USD")).thenReturn(redisValue);

        assertTrue(client.fetchCurrencyHistoryFromRedis("USD", "5y").isEmpty());
    }

    @Test
    void history_validData_returnsHistoricalDto() {
        LocalDate today = LocalDate.now();
        String json = String.format("[{\"date\":\"%s\",\"close\":34.5}]", today);
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        List<HistoricalDataDto> result = client.fetchCurrencyHistoryFromRedis("USD", "5y");

        assertEquals(1, result.size());
        HistoricalDataDto dto = result.get(0);
        assertEquals(today, dto.getDate());
        assertEquals(0, new BigDecimal("34.5000").compareTo(dto.getClose()));
        // OHLC all set to close
        assertEquals(dto.getClose(), dto.getOpen());
        assertEquals(dto.getClose(), dto.getHigh());
        assertEquals(dto.getClose(), dto.getLow());
        assertEquals(dto.getClose(), dto.getPrice());
        assertEquals(0L, dto.getVolume());
    }

    @Test
    void history_pointBeforeCutoff_filtered() {
        LocalDate today = LocalDate.now();
        LocalDate longAgo = today.minusYears(2);
        String json = String.format(
                "[{\"date\":\"%s\",\"close\":30.0},{\"date\":\"%s\",\"close\":35.0}]",
                longAgo, today);
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        // 1y cutoff
        List<HistoricalDataDto> result = client.fetchCurrencyHistoryFromRedis("USD", "1y");

        assertEquals(1, result.size());
        assertEquals(today, result.get(0).getDate());
    }

    @Test
    void history_skipsPointWithNullDateOrClose() {
        LocalDate today = LocalDate.now();
        String json = String.format(
                "[{\"close\":1.0},{\"date\":\"%s\",\"close\":null},{\"date\":\"%s\",\"close\":35.0}]",
                today, today);
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        List<HistoricalDataDto> result = client.fetchCurrencyHistoryFromRedis("USD", "5y");

        assertEquals(1, result.size());
    }

    @Test
    void history_invalidDateFormat_skipsPoint() {
        LocalDate today = LocalDate.now();
        String json = String.format(
                "[{\"date\":\"not-a-date\",\"close\":1.0},{\"date\":\"%s\",\"close\":35.0}]",
                today);
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        List<HistoricalDataDto> result = client.fetchCurrencyHistoryFromRedis("USD", "5y");

        assertEquals(1, result.size());
    }

    @Test
    void history_sortedByTimestamp() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate twoDaysAgo = today.minusDays(2);
        // unsorted
        String json = String.format(
                "[{\"date\":\"%s\",\"close\":3.0},{\"date\":\"%s\",\"close\":1.0},{\"date\":\"%s\",\"close\":2.0}]",
                today, twoDaysAgo, yesterday);
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        List<HistoricalDataDto> result = client.fetchCurrencyHistoryFromRedis("USD", "1y");

        assertEquals(3, result.size());
        // ascending by timestamp
        assertTrue(result.get(0).getTimestamp() < result.get(1).getTimestamp());
        assertTrue(result.get(1).getTimestamp() < result.get(2).getTimestamp());
    }

    @Test
    void history_variousRanges_correctCutoff() {
        LocalDate today = LocalDate.now();
        LocalDate longAgo = today.minusYears(50);
        String json = String.format(
                "[{\"date\":\"%s\",\"close\":1.0},{\"date\":\"%s\",\"close\":2.0}]",
                longAgo, today);
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        // 1w cutoff
        assertEquals(1, client.fetchCurrencyHistoryFromRedis("USD", "1w").size());
        // 1mo cutoff
        assertEquals(1, client.fetchCurrencyHistoryFromRedis("USD", "1mo").size());
        // 3mo cutoff
        assertEquals(1, client.fetchCurrencyHistoryFromRedis("USD", "3mo").size());
        // 6mo cutoff
        assertEquals(1, client.fetchCurrencyHistoryFromRedis("USD", "6mo").size());
        // 1y cutoff
        assertEquals(1, client.fetchCurrencyHistoryFromRedis("USD", "1y").size());
        // 5y cutoff
        assertEquals(1, client.fetchCurrencyHistoryFromRedis("USD", "5y").size());
        // 10y cutoff
        assertEquals(1, client.fetchCurrencyHistoryFromRedis("USD", "10y").size());
        // all / max → 100yr cutoff includes both
        assertEquals(2, client.fetchCurrencyHistoryFromRedis("USD", "all").size());
        assertEquals(2, client.fetchCurrencyHistoryFromRedis("USD", "max").size());
        // unknown range → default 30 days
        assertEquals(1, client.fetchCurrencyHistoryFromRedis("USD", "unknown").size());
    }
}
