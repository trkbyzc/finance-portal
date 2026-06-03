package com.financeportal.domains.economic_calendar.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.economic_calendar.dto.EconomicEventDto;
import com.financeportal.model.enums.EventImpact;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FinnhubEconomicCalendarClientTest {

    @Mock private RestTemplate restTemplate;

    private FinnhubEconomicCalendarClient client;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        client = new FinnhubEconomicCalendarClient(restTemplate);
        ReflectionTestUtils.setField(client, "baseUrl", "https://finnhub.io");
        ReflectionTestUtils.setField(client, "apiKey", "test-token");
    }

    private JsonNode parse(String json) throws Exception {
        return objectMapper.readTree(json);
    }

    @Test
    void fetch_emptyApiKey_skipsFetch() {
        ReflectionTestUtils.setField(client, "apiKey", "");

        List<EconomicEventDto> result = client.fetchCalendar(LocalDate.now(), LocalDate.now().plusDays(7));

        assertTrue(result.isEmpty());
        verify(restTemplate, never()).getForObject(anyString(), eq(JsonNode.class));
    }

    @Test
    void fetch_blankApiKey_skipsFetch() {
        ReflectionTestUtils.setField(client, "apiKey", "   ");

        List<EconomicEventDto> result = client.fetchCalendar(LocalDate.now(), LocalDate.now().plusDays(7));

        assertTrue(result.isEmpty());
    }

    @Test
    void fetch_validResponse_parsesEvents() throws Exception {
        String json = "{\"economicCalendar\":[" +
                "{\"country\":\"US\",\"event\":\"CPI\",\"time\":\"2026-06-15 13:30:00\"," +
                "\"impact\":\"high\",\"actual\":2.5,\"estimate\":2.4,\"prev\":2.3,\"unit\":\"%\"}" +
                "]}";
        when(restTemplate.getForObject(anyString(), eq(JsonNode.class))).thenReturn(parse(json));

        List<EconomicEventDto> result = client.fetchCalendar(LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30));

        assertEquals(1, result.size());
        EconomicEventDto dto = result.get(0);
        assertEquals("US", dto.getCountry());
        assertEquals("CPI", dto.getEvent());
        assertEquals(EventImpact.HIGH, dto.getImpact());
        assertEquals(LocalDateTime.of(2026, 6, 15, 13, 30, 0), dto.getTime());
        assertEquals(0, new BigDecimal("2.5").compareTo(dto.getActual()));
        assertEquals("%", dto.getUnit());
        // ID = country|event|time
        assertEquals("US|CPI|2026-06-15 13:30:00", dto.getId());
    }

    @Test
    void fetch_impactVariants_parsedCorrectly() throws Exception {
        String json = "{\"economicCalendar\":[" +
                "{\"country\":\"US\",\"event\":\"E1\",\"time\":\"2026-06-15 10:00:00\",\"impact\":\"high\"}," +
                "{\"country\":\"US\",\"event\":\"E2\",\"time\":\"2026-06-15 11:00:00\",\"impact\":\"medium\"}," +
                "{\"country\":\"US\",\"event\":\"E3\",\"time\":\"2026-06-15 12:00:00\",\"impact\":\"low\"}," +
                "{\"country\":\"US\",\"event\":\"E4\",\"time\":\"2026-06-15 13:00:00\",\"impact\":\"unknown\"}" +
                "]}";
        when(restTemplate.getForObject(anyString(), eq(JsonNode.class))).thenReturn(parse(json));

        List<EconomicEventDto> result = client.fetchCalendar(LocalDate.now(), LocalDate.now());

        assertEquals(EventImpact.HIGH, result.get(0).getImpact());
        assertEquals(EventImpact.MEDIUM, result.get(1).getImpact());
        assertEquals(EventImpact.LOW, result.get(2).getImpact());
        assertEquals(EventImpact.LOW, result.get(3).getImpact()); // unknown → LOW
    }

    @Test
    void fetch_nullImpact_defaultsToLow() throws Exception {
        String json = "{\"economicCalendar\":[" +
                "{\"country\":\"US\",\"event\":\"E1\",\"time\":\"2026-06-15 10:00:00\"}" +
                "]}";
        when(restTemplate.getForObject(anyString(), eq(JsonNode.class))).thenReturn(parse(json));

        List<EconomicEventDto> result = client.fetchCalendar(LocalDate.now(), LocalDate.now());

        assertEquals(EventImpact.LOW, result.get(0).getImpact());
    }

    @Test
    void fetch_missingRequiredFields_skipped() throws Exception {
        String json = "{\"economicCalendar\":[" +
                "{\"event\":\"NoCountry\",\"time\":\"2026-06-15 10:00:00\"}," +
                "{\"country\":\"US\",\"time\":\"2026-06-15 10:00:00\"}," +
                "{\"country\":\"US\",\"event\":\"NoTime\"}," +
                "{\"country\":\"TR\",\"event\":\"OK\",\"time\":\"2026-06-15 10:00:00\"}" +
                "]}";
        when(restTemplate.getForObject(anyString(), eq(JsonNode.class))).thenReturn(parse(json));

        List<EconomicEventDto> result = client.fetchCalendar(LocalDate.now(), LocalDate.now());

        // Only the last entry has all required fields
        assertEquals(1, result.size());
        assertEquals("OK", result.get(0).getEvent());
    }

    @Test
    void fetch_invalidTimeFormat_skipped() throws Exception {
        String json = "{\"economicCalendar\":[" +
                "{\"country\":\"US\",\"event\":\"E1\",\"time\":\"not-a-date\"}" +
                "]}";
        when(restTemplate.getForObject(anyString(), eq(JsonNode.class))).thenReturn(parse(json));

        assertTrue(client.fetchCalendar(LocalDate.now(), LocalDate.now()).isEmpty());
    }

    @Test
    void fetch_nullResponse_returnsEmpty() {
        when(restTemplate.getForObject(anyString(), eq(JsonNode.class))).thenReturn(null);

        assertTrue(client.fetchCalendar(LocalDate.now(), LocalDate.now()).isEmpty());
    }

    @Test
    void fetch_noEconomicCalendarField_returnsEmpty() throws Exception {
        when(restTemplate.getForObject(anyString(), eq(JsonNode.class))).thenReturn(parse("{}"));

        assertTrue(client.fetchCalendar(LocalDate.now(), LocalDate.now()).isEmpty());
    }

    @Test
    void fetch_economicCalendarNotArray_returnsEmpty() throws Exception {
        when(restTemplate.getForObject(anyString(), eq(JsonNode.class)))
                .thenReturn(parse("{\"economicCalendar\":\"not array\"}"));

        assertTrue(client.fetchCalendar(LocalDate.now(), LocalDate.now()).isEmpty());
    }

    @Test
    void fetch_apiThrows_returnsEmpty() {
        when(restTemplate.getForObject(anyString(), eq(JsonNode.class)))
                .thenThrow(new RuntimeException("503"));

        assertTrue(client.fetchCalendar(LocalDate.now(), LocalDate.now()).isEmpty());
    }

    @Test
    void fetch_decimalAsString_parsed() throws Exception {
        String json = "{\"economicCalendar\":[" +
                "{\"country\":\"US\",\"event\":\"E1\",\"time\":\"2026-06-15 10:00:00\"," +
                "\"actual\":\"2.5\",\"estimate\":\"2.4\"}" +
                "]}";
        when(restTemplate.getForObject(anyString(), eq(JsonNode.class))).thenReturn(parse(json));

        List<EconomicEventDto> result = client.fetchCalendar(LocalDate.now(), LocalDate.now());

        assertEquals(0, new BigDecimal("2.5").compareTo(result.get(0).getActual()));
    }

    @Test
    void fetch_decimalAsInvalidString_returnsNull() throws Exception {
        String json = "{\"economicCalendar\":[" +
                "{\"country\":\"US\",\"event\":\"E1\",\"time\":\"2026-06-15 10:00:00\"," +
                "\"actual\":\"not-a-number\"}" +
                "]}";
        when(restTemplate.getForObject(anyString(), eq(JsonNode.class))).thenReturn(parse(json));

        List<EconomicEventDto> result = client.fetchCalendar(LocalDate.now(), LocalDate.now());

        assertNull(result.get(0).getActual());
    }

    @Test
    void fetch_unitMissing_emptyString() throws Exception {
        String json = "{\"economicCalendar\":[" +
                "{\"country\":\"US\",\"event\":\"E1\",\"time\":\"2026-06-15 10:00:00\"}" +
                "]}";
        when(restTemplate.getForObject(anyString(), eq(JsonNode.class))).thenReturn(parse(json));

        List<EconomicEventDto> result = client.fetchCalendar(LocalDate.now(), LocalDate.now());
        assertEquals("", result.get(0).getUnit());
    }
}
