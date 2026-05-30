package com.financeportal.domains.economic_calendar.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.financeportal.domains.economic_calendar.dto.EconomicEventDto;
import com.financeportal.model.enums.EventImpact;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EconomicCalendarServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOps;

    private EconomicCalendarService service;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        service = new EconomicCalendarService(redisTemplate, objectMapper);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Test
    void noCache_returnsEmpty() {
        when(valueOps.get("cache:economic-calendar")).thenReturn(null);
        List<EconomicEventDto> result = service.getEvents(null, null, null, null);
        assertTrue(result.isEmpty());
    }

    @Test
    void invalidJson_swallowsAndReturnsEmpty() {
        when(valueOps.get("cache:economic-calendar")).thenReturn("garbage{");
        List<EconomicEventDto> result = service.getEvents(null, null, null, null);
        assertTrue(result.isEmpty());
    }

    @Test
    void noFilters_returnsAllSortedByTime() throws Exception {
        List<EconomicEventDto> events = List.of(
                makeEvent("e1", "US", "Event B", LocalDateTime.of(2026, 6, 15, 10, 0), EventImpact.HIGH),
                makeEvent("e2", "TR", "Event A", LocalDateTime.of(2026, 6, 1, 10, 0), EventImpact.LOW),
                makeEvent("e3", "EU", "Event C", LocalDateTime.of(2026, 6, 10, 10, 0), EventImpact.MEDIUM)
        );
        when(valueOps.get("cache:economic-calendar")).thenReturn(objectMapper.writeValueAsString(events));

        List<EconomicEventDto> result = service.getEvents(null, null, null, null);

        assertEquals(3, result.size());
        // Sorted by time ascending
        assertEquals("e2", result.get(0).getId()); // Jun 1
        assertEquals("e3", result.get(1).getId()); // Jun 10
        assertEquals("e1", result.get(2).getId()); // Jun 15
    }

    @Test
    void filterByCountry_onlyMatchingReturned() throws Exception {
        List<EconomicEventDto> events = List.of(
                makeEvent("e1", "US", "X", LocalDateTime.of(2026, 6, 1, 10, 0), EventImpact.HIGH),
                makeEvent("e2", "TR", "Y", LocalDateTime.of(2026, 6, 2, 10, 0), EventImpact.HIGH),
                makeEvent("e3", "EU", "Z", LocalDateTime.of(2026, 6, 3, 10, 0), EventImpact.HIGH)
        );
        when(valueOps.get("cache:economic-calendar")).thenReturn(objectMapper.writeValueAsString(events));

        List<EconomicEventDto> result = service.getEvents(null, null, Set.of("US", "EU"), null);

        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(e -> "US".equals(e.getCountry()) || "EU".equals(e.getCountry())));
    }

    @Test
    void filterByImpactHIGH_excludesLowerImpact() throws Exception {
        List<EconomicEventDto> events = List.of(
                makeEvent("e1", "US", "X", LocalDateTime.of(2026, 6, 1, 10, 0), EventImpact.LOW),
                makeEvent("e2", "TR", "Y", LocalDateTime.of(2026, 6, 2, 10, 0), EventImpact.MEDIUM),
                makeEvent("e3", "EU", "Z", LocalDateTime.of(2026, 6, 3, 10, 0), EventImpact.HIGH)
        );
        when(valueOps.get("cache:economic-calendar")).thenReturn(objectMapper.writeValueAsString(events));

        List<EconomicEventDto> result = service.getEvents(null, null, null, EventImpact.HIGH);

        assertEquals(1, result.size());
        assertEquals("e3", result.get(0).getId());
    }

    @Test
    void filterByImpactMEDIUM_includesMediumAndHigh() throws Exception {
        List<EconomicEventDto> events = List.of(
                makeEvent("e1", "US", "X", LocalDateTime.of(2026, 6, 1, 10, 0), EventImpact.LOW),
                makeEvent("e2", "TR", "Y", LocalDateTime.of(2026, 6, 2, 10, 0), EventImpact.MEDIUM),
                makeEvent("e3", "EU", "Z", LocalDateTime.of(2026, 6, 3, 10, 0), EventImpact.HIGH)
        );
        when(valueOps.get("cache:economic-calendar")).thenReturn(objectMapper.writeValueAsString(events));

        List<EconomicEventDto> result = service.getEvents(null, null, null, EventImpact.MEDIUM);

        assertEquals(2, result.size());
    }

    @Test
    void filterByDateRange_includesEdgeDates() throws Exception {
        List<EconomicEventDto> events = List.of(
                makeEvent("e1", "US", "X", LocalDateTime.of(2026, 6, 1, 0, 0), EventImpact.HIGH),
                makeEvent("e2", "TR", "Y", LocalDateTime.of(2026, 6, 15, 12, 0), EventImpact.HIGH),
                makeEvent("e3", "EU", "Z", LocalDateTime.of(2026, 6, 30, 23, 59), EventImpact.HIGH),
                makeEvent("e4", "JP", "W", LocalDateTime.of(2026, 7, 1, 0, 0), EventImpact.HIGH)
        );
        when(valueOps.get("cache:economic-calendar")).thenReturn(objectMapper.writeValueAsString(events));

        // From inclusive, to inclusive
        List<EconomicEventDto> result = service.getEvents(
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30), null, null);

        assertEquals(3, result.size()); // e1, e2, e3 — e4 hariç
    }

    @Test
    void filterByCountry_emptySet_treatedAsNoFilter() throws Exception {
        List<EconomicEventDto> events = List.of(
                makeEvent("e1", "US", "X", LocalDateTime.of(2026, 6, 1, 10, 0), EventImpact.HIGH),
                makeEvent("e2", "TR", "Y", LocalDateTime.of(2026, 6, 2, 10, 0), EventImpact.HIGH)
        );
        when(valueOps.get("cache:economic-calendar")).thenReturn(objectMapper.writeValueAsString(events));

        List<EconomicEventDto> result = service.getEvents(null, null, Set.of(), null);

        assertEquals(2, result.size());
    }

    @Test
    void nullImpactInEvent_filteredOut() throws Exception {
        EconomicEventDto withNullImpact = makeEvent("e1", "US", "X",
                LocalDateTime.of(2026, 6, 1, 10, 0), null);
        EconomicEventDto withHigh = makeEvent("e2", "TR", "Y",
                LocalDateTime.of(2026, 6, 2, 10, 0), EventImpact.HIGH);

        when(valueOps.get("cache:economic-calendar"))
                .thenReturn(objectMapper.writeValueAsString(List.of(withNullImpact, withHigh)));

        List<EconomicEventDto> result = service.getEvents(null, null, null, EventImpact.LOW);

        // null impact'li olan minImpact filtresinden geçemez
        assertEquals(1, result.size());
        assertEquals("e2", result.get(0).getId());
    }

    private EconomicEventDto makeEvent(String id, String country, String event, LocalDateTime time, EventImpact impact) {
        EconomicEventDto e = new EconomicEventDto();
        e.setId(id);
        e.setCountry(country);
        e.setEvent(event);
        e.setTime(time);
        e.setImpact(impact);
        return e;
    }
}
