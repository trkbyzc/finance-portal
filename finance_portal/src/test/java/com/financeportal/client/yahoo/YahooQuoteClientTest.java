package com.financeportal.client.yahoo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.model.dto.market.MarketAssetDto;
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
class YahooQuoteClientTest {

    @Mock private RestTemplate restTemplate;

    @InjectMocks private YahooQuoteClient client;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private ResponseEntity<JsonNode> mockResponse(String json) throws Exception {
        return ResponseEntity.ok(objectMapper.readTree(json));
    }

    // -------- happy path --------

    @Test
    void fetchQuotes_singleSymbol_returnsParsedDto() throws Exception {
        String json = "{\"chart\":{\"result\":[{\"meta\":{" +
                "\"regularMarketPrice\":180.5,\"chartPreviousClose\":175.0," +
                "\"shortName\":\"Apple Inc\",\"regularMarketVolume\":1000000}}]}}";
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(mockResponse(json));

        List<MarketAssetDto> result = client.fetchQuotes(new String[]{"AAPL"}, "STOCK");

        assertEquals(1, result.size());
        MarketAssetDto dto = result.get(0);
        assertEquals("AAPL", dto.getSymbol());
        assertEquals("Apple Inc", dto.getName());
        assertEquals("STOCK", dto.getAssetType());
        assertEquals(0, new java.math.BigDecimal("180.50").compareTo(dto.getPrice()));
        // changePct = (180.5 - 175) / 175 * 100 ≈ 3.14
        assertTrue(dto.getChangePercent().compareTo(java.math.BigDecimal.ZERO) > 0);
        assertEquals(1000000L, dto.getVolume());
        assertEquals("CANDLE", dto.getChartType());
        assertEquals("GLOBAL_ASSET", dto.getAssetCategory()); // AAPL doesn't end with .IS
    }

    @Test
    void fetchQuotes_bistStockSymbol_categoryIsSTOCK() throws Exception {
        String json = "{\"chart\":{\"result\":[{\"meta\":{" +
                "\"regularMarketPrice\":50.0,\"chartPreviousClose\":48.0," +
                "\"shortName\":\"Akbank\",\"regularMarketVolume\":500000}}]}}";
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(mockResponse(json));

        List<MarketAssetDto> result = client.fetchQuotes(new String[]{"AKBNK.IS"}, "STOCK");

        assertEquals(1, result.size());
        // .IS suffix && not starting with X → STOCK
        assertEquals("STOCK", result.get(0).getAssetCategory());
    }

    @Test
    void fetchQuotes_bistIndexSymbol_categoryIsINDEX() throws Exception {
        String json = "{\"chart\":{\"result\":[{\"meta\":{" +
                "\"regularMarketPrice\":11000.0,\"chartPreviousClose\":10900.0," +
                "\"regularMarketVolume\":0}}]}}";
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(mockResponse(json));

        List<MarketAssetDto> result = client.fetchQuotes(new String[]{"XU100.IS"}, "INDEX");

        // .IS suffix && starts with X → INDEX
        assertEquals("INDEX", result.get(0).getAssetCategory());
    }

    @Test
    void fetchQuotes_noShortName_usesSymbolAsName() throws Exception {
        String json = "{\"chart\":{\"result\":[{\"meta\":{" +
                "\"regularMarketPrice\":100.0,\"chartPreviousClose\":95.0}}]}}";
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(mockResponse(json));

        List<MarketAssetDto> result = client.fetchQuotes(new String[]{"BTC-USD"}, "CRYPTO");

        assertEquals("BTC-USD", result.get(0).getName());
    }

    // -------- error cases --------

    @Test
    void fetchQuotes_zeroPrice_skipsAsset() throws Exception {
        String json = "{\"chart\":{\"result\":[{\"meta\":{" +
                "\"regularMarketPrice\":0.0,\"chartPreviousClose\":100.0}}]}}";
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(mockResponse(json));

        List<MarketAssetDto> result = client.fetchQuotes(new String[]{"X"}, "STOCK");

        assertTrue(result.isEmpty());
    }

    @Test
    void fetchQuotes_zeroPrevClose_changePctIsZero() throws Exception {
        String json = "{\"chart\":{\"result\":[{\"meta\":{" +
                "\"regularMarketPrice\":100.0,\"chartPreviousClose\":0}}]}}";
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(mockResponse(json));

        List<MarketAssetDto> result = client.fetchQuotes(new String[]{"X"}, "STOCK");

        assertEquals(java.math.BigDecimal.ZERO, result.get(0).getChangePercent());
    }

    @Test
    void fetchQuotes_serverError_skipsThatSymbolAndContinues() throws Exception {
        // First symbol throws, second succeeds
        when(restTemplate.exchange(contains("BAD"), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenThrow(new RuntimeException("503"));
        String json = "{\"chart\":{\"result\":[{\"meta\":{" +
                "\"regularMarketPrice\":100.0,\"chartPreviousClose\":95.0}}]}}";
        when(restTemplate.exchange(contains("GOOD"), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(mockResponse(json));

        List<MarketAssetDto> result = client.fetchQuotes(new String[]{"BAD", "GOOD"}, "STOCK");

        assertEquals(1, result.size());
        assertEquals("GOOD", result.get(0).getSymbol());
    }

    @Test
    void fetchQuotes_emptySymbolList_returnsEmpty() {
        List<MarketAssetDto> result = client.fetchQuotes(new String[]{}, "STOCK");
        assertTrue(result.isEmpty());
    }

    @Test
    void fetchQuotes_nullBody_skips() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(ResponseEntity.ok().build());

        List<MarketAssetDto> result = client.fetchQuotes(new String[]{"X"}, "STOCK");

        assertTrue(result.isEmpty());
    }

    @Test
    void fetchQuotes_multipleSymbols_allParsed() throws Exception {
        String json = "{\"chart\":{\"result\":[{\"meta\":{" +
                "\"regularMarketPrice\":100.0,\"chartPreviousClose\":95.0}}]}}";
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(mockResponse(json));

        List<MarketAssetDto> result = client.fetchQuotes(new String[]{"A", "B", "C"}, "STOCK");

        assertEquals(3, result.size());
    }

    @Test
    void fetchQuotes_priceChangeNegative_changePctIsNegative() throws Exception {
        String json = "{\"chart\":{\"result\":[{\"meta\":{" +
                "\"regularMarketPrice\":90.0,\"chartPreviousClose\":100.0}}]}}";
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(JsonNode.class)))
                .thenReturn(mockResponse(json));

        List<MarketAssetDto> result = client.fetchQuotes(new String[]{"X"}, "STOCK");

        // (90-100)/100*100 = -10%
        assertTrue(result.get(0).getChangePercent().compareTo(java.math.BigDecimal.ZERO) < 0);
    }
}
