package com.financeportal.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EvdsClientTest {

    @Mock private RestTemplate restTemplate;

    private EvdsClient client;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        client = new EvdsClient(restTemplate, objectMapper);
        ReflectionTestUtils.setField(client, "baseUrl", "https://evds3.tcmb.gov.tr/igmevdsms-dis");
        ReflectionTestUtils.setField(client, "apiKey", "test-key");
    }

    // -------- fetchSeries --------

    @Test
    void fetchSeries_validResponse_returnsItems() {
        String json = "{\"items\":[{\"Tarih\":\"01-01-2024\",\"TP_X\":\"100\"},{\"Tarih\":\"02-01-2024\",\"TP_X\":\"110\"}]}";
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(json));

        List<JsonNode> result = client.fetchSeries(List.of("TP.X"),
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 2), null);

        assertEquals(2, result.size());
        assertEquals("01-01-2024", result.get(0).path("Tarih").asText());
    }

    @Test
    void fetchSeries_emptyItems_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"items\":[]}"));

        List<JsonNode> result = client.fetchSeries(List.of("TP.X"),
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 2), null);

        assertTrue(result.isEmpty());
    }

    @Test
    void fetchSeries_noItemsField_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{}"));

        List<JsonNode> result = client.fetchSeries(List.of("TP.X"),
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 2), null);

        assertTrue(result.isEmpty());
    }

    @Test
    void fetchSeries_nullBody_returnsEmpty() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok().build());

        List<JsonNode> result = client.fetchSeries(List.of("TP.X"),
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 2), null);

        assertTrue(result.isEmpty());
    }

    @Test
    void fetchSeries_serverError_returnsEmptyAfterRetries() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("503"));

        List<JsonNode> result = client.fetchSeries(List.of("TP.X"),
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 2), null);

        // 3 retry sonra empty
        assertTrue(result.isEmpty());
    }

    @Test
    void fetchSeries_withFormulas_includesParam() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"items\":[]}"));

        client.fetchSeries(List.of("TP.X"),
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 2), "3");

        // Mocked OK — sadece exception almadığını verify
        org.mockito.Mockito.verify(restTemplate).exchange(
                org.mockito.ArgumentMatchers.contains("formulas=3"),
                eq(HttpMethod.GET), any(), eq(String.class));
    }

    @Test
    void fetchSeries_multipleSeriesCodes_joinedWithHyphen() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"items\":[]}"));

        client.fetchSeries(List.of("TP.X", "TP.Y"),
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 2), null);

        org.mockito.Mockito.verify(restTemplate).exchange(
                org.mockito.ArgumentMatchers.contains("series=TP.X-TP.Y"),
                eq(HttpMethod.GET), any(), eq(String.class));
    }

    // -------- fetchSeriesPaginated --------

    @Test
    void paginated_singleChunk_returnsAllData() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"items\":[{\"Tarih\":\"01-01-2024\",\"TP_X\":\"100\"}]}"));

        List<JsonNode> result = client.fetchSeriesPaginated(List.of("TP.X"),
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 1), 3);

        assertEquals(1, result.size());
    }

    @Test
    void paginated_chunkYearsLessThan1_defaultsTo3() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"items\":[]}"));

        List<JsonNode> result = client.fetchSeriesPaginated(List.of("TP.X"),
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 1), 0);

        assertTrue(result.isEmpty());
    }

    @Test
    void paginated_dedupesOnDateBoundary() {
        // Both chunks return same date — should dedupe
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"items\":[{\"Tarih\":\"01-01-2024\",\"TP_X\":\"100\"}]}"));

        List<JsonNode> result = client.fetchSeriesPaginated(List.of("TP.X"),
                LocalDate.of(2024, 1, 1), LocalDate.of(2027, 1, 1), 1);

        // Multiple chunks but same date repeated → 1 unique result
        assertEquals(1, result.size());
    }

    @Test
    void paginated_skipsNullDateNodes() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"items\":[{\"TP_X\":\"100\"}]}"));

        List<JsonNode> result = client.fetchSeriesPaginated(List.of("TP.X"),
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 1), 3);

        assertTrue(result.isEmpty());
    }

    // -------- extractValueFromNode --------

    @Test
    void extract_exactMatch_returnsValue() throws Exception {
        JsonNode node = objectMapper.readTree("{\"TP_X\":\"42.5\"}");
        assertEquals(42.5, client.extractValueFromNode(node, "TP.X"));
    }

    @org.junit.jupiter.params.ParameterizedTest(name = "extract({0}) → null")
    @org.junit.jupiter.params.provider.ValueSource(strings = {"", "ND", "null", "not-a-number"})
    void extract_invalidValues_returnNull(String raw) throws Exception {
        JsonNode node = objectMapper.readTree("{\"TP_X\":\"" + raw + "\"}");
        assertNull(client.extractValueFromNode(node, "TP.X"));
    }

    @Test
    void extract_fuzzyMatch_findsColumnContaining() throws Exception {
        // Formula 3 ekler kolon adına suffix
        JsonNode node = objectMapper.readTree("{\"TP_X_FORMULA3\":\"15.5\"}");
        assertEquals(15.5, client.extractValueFromNode(node, "TP.X"));
    }

    @Test
    void extract_noMatch_returnsNull() throws Exception {
        JsonNode node = objectMapper.readTree("{\"OTHER_FIELD\":\"100\"}");
        assertNull(client.extractValueFromNode(node, "TP.X"));
    }

    @Test
    void extract_emptyNode_returnsNull() throws Exception {
        JsonNode node = objectMapper.readTree("{}");
        assertNull(client.extractValueFromNode(node, "TP.X"));
    }
}
