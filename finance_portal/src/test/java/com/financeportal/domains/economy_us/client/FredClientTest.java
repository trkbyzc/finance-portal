package com.financeportal.domains.economy_us.client;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FredClientTest {

    @Mock private RestTemplate restTemplate;

    private FredClient client;

    @BeforeEach
    void setUp() {
        client = new FredClient(restTemplate, new ObjectMapper());
        ReflectionTestUtils.setField(client, "baseUrl", "https://api.stlouisfed.org");
        ReflectionTestUtils.setField(client, "apiKey", "test-key");
    }

    @Test
    void fetch_emptyApiKey_skipsAndReturnsEmpty() {
        ReflectionTestUtils.setField(client, "apiKey", "");

        List<Map<String, Object>> result = client.fetchObservations("CPIAUCSL", LocalDate.now().minusYears(1), LocalDate.now());

        assertTrue(result.isEmpty());
        verify(restTemplate, never()).getForEntity(anyString(), eq(String.class));
    }

    @Test
    void fetch_blankApiKey_skipsAndReturnsEmpty() {
        ReflectionTestUtils.setField(client, "apiKey", "   ");

        List<Map<String, Object>> result = client.fetchObservations("CPIAUCSL", LocalDate.now(), LocalDate.now());

        assertTrue(result.isEmpty());
    }

    @Test
    void fetch_validResponse_parsesObservations() {
        String json = "{\"observations\":[" +
                "{\"date\":\"2024-01-01\",\"value\":\"308.4\"}," +
                "{\"date\":\"2024-02-01\",\"value\":\"309.0\"}" +
                "]}";
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(json));

        List<Map<String, Object>> result = client.fetchObservations("CPIAUCSL", LocalDate.now().minusYears(1), LocalDate.now());

        assertEquals(2, result.size());
        assertEquals("2024-01-01", result.get(0).get("date"));
        assertEquals(308.4, result.get(0).get("value"));
        assertEquals("2024-01", result.get(0).get("label"));
    }

    @Test
    void fetch_dotValue_skipped() {
        // FRED returns "." for missing values
        String json = "{\"observations\":[" +
                "{\"date\":\"2024-01-01\",\"value\":\".\"}," +
                "{\"date\":\"2024-02-01\",\"value\":\"309.0\"}" +
                "]}";
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(json));

        List<Map<String, Object>> result = client.fetchObservations("CPIAUCSL", LocalDate.now().minusYears(1), LocalDate.now());

        // Dot value skipped
        assertEquals(1, result.size());
    }

    @Test
    void fetch_invalidNumber_skipped() {
        String json = "{\"observations\":[" +
                "{\"date\":\"2024-01-01\",\"value\":\"not-a-number\"}" +
                "]}";
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(json));

        List<Map<String, Object>> result = client.fetchObservations("CPIAUCSL", LocalDate.now().minusYears(1), LocalDate.now());

        assertTrue(result.isEmpty());
    }

    @Test
    void fetch_emptyObservations_returnsEmpty() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"observations\":[]}"));

        assertTrue(client.fetchObservations("CPIAUCSL", LocalDate.now().minusYears(1), LocalDate.now()).isEmpty());
    }

    @Test
    void fetch_noObservationsField_returnsEmpty() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{}"));

        assertTrue(client.fetchObservations("CPIAUCSL", LocalDate.now().minusYears(1), LocalDate.now()).isEmpty());
    }

    @Test
    void fetch_nullBody_returnsEmpty() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok().build());

        assertTrue(client.fetchObservations("CPIAUCSL", LocalDate.now().minusYears(1), LocalDate.now()).isEmpty());
    }

    @Test
    void fetch_apiThrowsAllRetries_returnsEmpty() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenThrow(new RuntimeException("503"));

        List<Map<String, Object>> result = client.fetchObservations("CPIAUCSL", LocalDate.now().minusYears(1), LocalDate.now());

        assertTrue(result.isEmpty());
        // 3 retries
        verify(restTemplate, org.mockito.Mockito.times(3)).getForEntity(anyString(), eq(String.class));
    }

    @Test
    void fetch_recoversOnRetry() {
        String validJson = "{\"observations\":[{\"date\":\"2024-01-01\",\"value\":\"100\"}]}";
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenThrow(new RuntimeException("503"))
                .thenReturn(ResponseEntity.ok(validJson));

        List<Map<String, Object>> result = client.fetchObservations("CPIAUCSL", LocalDate.now().minusYears(1), LocalDate.now());

        assertEquals(1, result.size());
    }

    @Test
    void fetch_observationMissingDate_skipped() {
        String json = "{\"observations\":[{\"value\":\"100\"}]}";
        when(restTemplate.getForEntity(anyString(), eq(String.class))).thenReturn(ResponseEntity.ok(json));

        assertTrue(client.fetchObservations("CPIAUCSL", LocalDate.now().minusYears(1), LocalDate.now()).isEmpty());
    }
}
