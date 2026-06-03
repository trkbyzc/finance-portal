package com.financeportal.client.yahoo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.model.dto.market.HistoricalDataDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class YahooChartClientTest {

    @Mock private RestTemplate restTemplate;
    @InjectMocks private YahooChartClient client;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private ResponseEntity<JsonNode> ok(String json) throws Exception {
        return ResponseEntity.ok(objectMapper.readTree(json));
    }

    // -------- happy path --------

    @Test
    void fetch_validResponse_parsesAllFields() throws Exception {
        String json = "{\"chart\":{\"result\":[{" +
                "\"timestamp\":[1700000000,1700086400]," +
                "\"indicators\":{\"quote\":[{" +
                "\"close\":[100.0, 110.0]," +
                "\"open\":[99.0, 105.0]," +
                "\"high\":[102.0, 112.0]," +
                "\"low\":[98.0, 104.0]," +
                "\"volume\":[1000, 2000]" +
                "}]}}]}}";

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ok(json));

        List<HistoricalDataDto> result = client.fetchChartHistory("AAPL", "1mo", "1d", null, null);

        assertEquals(2, result.size());
        HistoricalDataDto p0 = result.get(0);
        assertEquals(0, java.math.BigDecimal.valueOf(100.0).setScale(8, java.math.RoundingMode.HALF_UP).compareTo(p0.getClose()));
        assertEquals(p0.getClose(), p0.getPrice());
        assertEquals(1000L, p0.getVolume());
    }

    @Test
    void fetch_emptyResult_returnsEmpty() throws Exception {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ok("{\"chart\":{\"result\":[]}}"));

        assertTrue(client.fetchChartHistory("X", "1y", "1d", null, null).isEmpty());
    }

    @Test
    void fetch_missingChartField_returnsEmpty() throws Exception {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ok("{}"));

        assertTrue(client.fetchChartHistory("X", "1y", "1d", null, null).isEmpty());
    }

    @Test
    void fetch_nullBody_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok().build());

        assertTrue(client.fetchChartHistory("X", "1y", "1d", null, null).isEmpty());
    }

    @Test
    void fetch_apiThrows_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenThrow(new RuntimeException("503"));

        assertTrue(client.fetchChartHistory("X", "1y", "1d", null, null).isEmpty());
    }

    @Test
    void fetch_nullCloseInArray_skipsThatPoint() throws Exception {
        String json = "{\"chart\":{\"result\":[{" +
                "\"timestamp\":[1700000000,1700086400]," +
                "\"indicators\":{\"quote\":[{" +
                "\"close\":[null, 110.0]," +
                "\"open\":[null, 105.0]," +
                "\"high\":[null, 112.0]," +
                "\"low\":[null, 104.0]," +
                "\"volume\":[null, 2000]" +
                "}]}}]}}";

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ok(json));

        // 1 nokta atılır (null close), 1 nokta gelir
        List<HistoricalDataDto> result = client.fetchChartHistory("X", "1y", "1d", null, null);
        assertEquals(1, result.size());
    }

    // -------- mapRange --------

    @Test
    void mapRange_variousInputs_correctOutput() throws Exception {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ok("{\"chart\":{\"result\":[]}}"));

        assertNotNull(client.fetchChartHistory("X", null, "1d", null, null));
        assertNotNull(client.fetchChartHistory("X", "1g", "1d", null, null));
        assertNotNull(client.fetchChartHistory("X", "1a", "1d", null, null));
        assertNotNull(client.fetchChartHistory("X", "ytd", "1d", null, null));
        assertNotNull(client.fetchChartHistory("X", "5y", "1d", null, null));
        assertNotNull(client.fetchChartHistory("X", "unknown_range", "1d", null, null));
    }

    @Test
    void mapRange_1d_overridesIntervalTo15m() throws Exception {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ok("{\"chart\":{\"result\":[]}}"));

        client.fetchChartHistory("X", "1d", "1d", null, null);

        // URL should contain interval=15m
        org.mockito.Mockito.verify(restTemplate).exchange(
                contains("interval=15m"),
                eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class));
    }

    // -------- custom date range --------

    @Test
    void fetch_customRangeWithStartEnd_usesPeriodEpochs() throws Exception {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ok("{\"chart\":{\"result\":[]}}"));

        client.fetchChartHistory("X", "custom", "1d", "2024-01-01", "2024-01-31");

        // URL should contain period1 and period2 (not range=)
        org.mockito.Mockito.verify(restTemplate).exchange(
                contains("period1="),
                eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class));
    }

    @Test
    void fetch_lowPriceCoin_preservesScale() throws Exception {
        // PEPE-like coin with very low price
        String json = "{\"chart\":{\"result\":[{" +
                "\"timestamp\":[1700000000]," +
                "\"indicators\":{\"quote\":[{" +
                "\"close\":[0.00000394]," +
                "\"open\":[0.00000390]," +
                "\"high\":[0.00000400]," +
                "\"low\":[0.00000380]," +
                "\"volume\":[1000000]" +
                "}]}}]}}";

        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ok(json));

        List<HistoricalDataDto> result = client.fetchChartHistory("PEPE-USD", "1y", "1d", null, null);

        assertEquals(1, result.size());
        // Scale 8 — küçük sayı korunmalı, 0'a yuvarlanmamalı
        assertTrue(result.get(0).getClose().compareTo(java.math.BigDecimal.ZERO) > 0);
    }
}
