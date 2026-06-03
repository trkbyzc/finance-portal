package com.financeportal.client.binance;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.model.dto.market.HistoricalDataDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BinanceChartClientTest {

    @Mock private RestTemplate restTemplate;

    private BinanceChartClient client;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        client = new BinanceChartClient(restTemplate);
        ReflectionTestUtils.setField(client, "binanceBaseUrl", "https://api.binance.com");
    }

    private JsonNode parse(String json) throws Exception {
        return objectMapper.readTree(json);
    }

    // -------- happy path --------

    @Test
    void fetchKlines_validResponse_parsesAllFields() throws Exception {
        // Binance returns: [openTime, open, high, low, close, volume, ...]
        String json = "[" +
                "[1700000000000,\"100.5\",\"102.0\",\"99.5\",\"101.0\",\"1000.5\",1700000000999,\"\",0,\"\",\"\",\"\"]," +
                "[1700086400000,\"101.0\",\"105.0\",\"100.0\",\"104.0\",\"2000\",1700086400999,\"\",0,\"\",\"\",\"\"]" +
                "]";
        when(restTemplate.getForEntity(anyString(), eq(JsonNode.class))).thenReturn(ResponseEntity.ok(parse(json)));

        List<HistoricalDataDto> result = client.fetchKlines("BTCUSDT", "1d");

        assertEquals(2, result.size());
        HistoricalDataDto bar = result.get(0);
        assertEquals(new BigDecimal("100.5"), bar.getOpen());
        assertEquals(new BigDecimal("102.0"), bar.getHigh());
        assertEquals(new BigDecimal("99.5"), bar.getLow());
        assertEquals(new BigDecimal("101.0"), bar.getClose());
        assertEquals(1000L, bar.getVolume()); // truncated to long
        assertEquals(1700000000000L, bar.getTimestamp());
    }

    @Test
    void fetchKlines_lowPrecisionPrice_preserved() throws Exception {
        // Small coin like PEPE
        String json = "[" +
                "[1700000000000,\"0.00000123\",\"0.00000130\",\"0.00000120\",\"0.00000125\",\"1000\",1700000000999,\"\",0,\"\",\"\",\"\"]" +
                "]";
        when(restTemplate.getForEntity(anyString(), eq(JsonNode.class))).thenReturn(ResponseEntity.ok(parse(json)));

        List<HistoricalDataDto> result = client.fetchKlines("PEPEUSDT", "1d");
        assertEquals(0, new BigDecimal("0.00000125").compareTo(result.get(0).getClose()));
    }

    @Test
    void fetchKlines_emptyArray_returnsEmpty() throws Exception {
        when(restTemplate.getForEntity(anyString(), eq(JsonNode.class))).thenReturn(ResponseEntity.ok(parse("[]")));

        assertTrue(client.fetchKlines("BTCUSDT", "1d").isEmpty());
    }

    @Test
    void fetchKlines_nullBody_returnsEmpty() {
        when(restTemplate.getForEntity(anyString(), eq(JsonNode.class))).thenReturn(ResponseEntity.ok().build());

        assertTrue(client.fetchKlines("BTCUSDT", "1d").isEmpty());
    }

    @Test
    void fetchKlines_nonArrayBody_returnsEmpty() throws Exception {
        when(restTemplate.getForEntity(anyString(), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok(parse("{\"error\":\"invalid\"}")));

        assertTrue(client.fetchKlines("BTCUSDT", "1d").isEmpty());
    }

    @Test
    void fetchKlines_apiThrows_returnsEmpty() {
        when(restTemplate.getForEntity(anyString(), eq(JsonNode.class)))
                .thenThrow(new RuntimeException("503"));

        assertTrue(client.fetchKlines("BTCUSDT", "1d").isEmpty());
    }

    @Test
    void fetchKlines_klineWithLessThan6Elements_skipped() throws Exception {
        String json = "[[1700000000000,\"100\",\"101\"]," +   // 3 elements only
                "[1700086400000,\"101\",\"105\",\"100\",\"104\",\"2000\",0,\"\",0,\"\",\"\",\"\"]]";
        when(restTemplate.getForEntity(anyString(), eq(JsonNode.class))).thenReturn(ResponseEntity.ok(parse(json)));

        List<HistoricalDataDto> result = client.fetchKlines("BTCUSDT", "1d");
        assertEquals(1, result.size());
    }

    // -------- range to interval/limit mapping --------

    @Test
    void mapRange_1d_uses15mInterval() {
        when(restTemplate.getForEntity(anyString(), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok().build());

        assertNotNull(client.fetchKlines("BTCUSDT", "1d"));

        verify(restTemplate).getForEntity(contains("interval=15m"), eq(JsonNode.class));
        verify(restTemplate).getForEntity(contains("limit=96"), eq(JsonNode.class));
    }

    @org.junit.jupiter.params.ParameterizedTest(name = "range={0} → interval={1}, limit={2}")
    @org.junit.jupiter.params.provider.CsvSource({
            "5y,interval=1w,limit=260",
            ",interval=1d,limit=30",
            "unknownrange,interval=1d,limit=30",
            "1mo,interval=1d,limit=30",
            "1y,interval=1d,limit=365",
            "5d,interval=1h,limit=168"
    })
    void mapRange_variousRanges_buildsCorrectIntervalAndLimit(String range, String interval, String limit) {
        when(restTemplate.getForEntity(anyString(), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok().build());

        client.fetchKlines("BTCUSDT", range);

        verify(restTemplate).getForEntity(contains(interval), eq(JsonNode.class));
        verify(restTemplate).getForEntity(contains(limit), eq(JsonNode.class));
    }

    @Test
    void mapRange_turkishAliases_handled() {
        when(restTemplate.getForEntity(anyString(), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok().build());

        assertNotNull(client.fetchKlines("BTCUSDT", "1g")); // gün = day
        assertNotNull(client.fetchKlines("BTCUSDT", "1a")); // ay = month
        assertNotNull(client.fetchKlines("BTCUSDT", "3a"));
        assertNotNull(client.fetchKlines("BTCUSDT", "6a"));
    }
}
