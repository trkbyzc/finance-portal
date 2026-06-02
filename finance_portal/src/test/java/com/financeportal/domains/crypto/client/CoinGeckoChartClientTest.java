package com.financeportal.domains.crypto.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.model.dto.market.HistoricalDataDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CoinGeckoChartClientTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private CoinGeckoChartClient client;

    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(client, "coinGeckoBaseUrl", "http://test/api/v3");
    }

    @Test
    void fetchOhlc_nullId_returnsEmpty_andSkipsHttp() {
        List<HistoricalDataDto> result = client.fetchOhlc(null, "1mo");
        assertTrue(result.isEmpty());
        verifyNoInteractions(restTemplate);
    }

    @Test
    void fetchOhlc_blankId_returnsEmpty_andSkipsHttp() {
        List<HistoricalDataDto> result = client.fetchOhlc("   ", "1mo");
        assertTrue(result.isEmpty());
        verifyNoInteractions(restTemplate);
    }

    @Test
    void fetchOhlc_mapsOhlcArray_withFullPrecision() throws Exception {
        // [timestamp_ms, open, high, low, close] — küçük fiyat tam hassasiyetle korunmalı
        JsonNode body = mapper.readTree(
                "[[1609459200000, \"0.000000001234\", \"0.000000002\", \"0.000000001\", \"0.000000001555\"]]");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok(body));

        List<HistoricalDataDto> result = client.fetchOhlc("bitcoin", "1mo");

        assertEquals(1, result.size());
        HistoricalDataDto dto = result.get(0);
        assertEquals(1609459200000L, dto.getTimestamp());
        assertEquals(new BigDecimal("0.000000001234"), dto.getOpen());
        assertEquals(new BigDecimal("0.000000001555"), dto.getClose());
        // close, price'a da yazılır
        assertEquals(dto.getClose(), dto.getPrice());
        // CoinGecko OHLC hacim sağlamaz
        assertEquals(null, dto.getVolume());
    }

    @Test
    void fetchOhlc_skipsMalformedRows() throws Exception {
        // İkinci satır eksik (4 eleman) → atlanmalı
        JsonNode body = mapper.readTree(
                "[[1, \"1\", \"2\", \"0.5\", \"1.5\"], [2, \"1\", \"2\", \"0.5\"]]");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok(body));

        List<HistoricalDataDto> result = client.fetchOhlc("bitcoin", "1mo");

        assertEquals(1, result.size());
    }

    @Test
    void fetchOhlc_emptyArray_returnsEmpty() throws Exception {
        JsonNode body = mapper.readTree("[]");
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok(body));

        assertTrue(client.fetchOhlc("bitcoin", "1mo").isEmpty());
    }

    @Test
    void fetchOhlc_httpException_returnsEmpty_doesNotThrow() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenThrow(new RuntimeException("429 rate limit"));

        assertTrue(client.fetchOhlc("bitcoin", "1mo").isEmpty());
        verify(restTemplate, never()).getForEntity(anyString(), any());
    }
}
