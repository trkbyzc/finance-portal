package com.financeportal.domains.economy.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.financeportal.domains.economy.dto.EconomyDto;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EconomyServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOps;

    private EconomyService service;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        service = new EconomyService(redisTemplate, objectMapper);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    // -------- getMacroEconomyData --------

    @Test
    void macro_redisHasData_returnsParsedDto() {
        String json = "{\"interestRate\":40.0,\"inflationRate\":55.3,\"unemploymentRate\":9.1,\"lastUpdated\":\"2026-05-01\"}";
        when(valueOps.get("market:economy:turkey")).thenReturn(json);

        EconomyDto result = service.getMacroEconomyData();

        assertEquals(40.0, result.getInterestRate());
        assertEquals(55.3, result.getInflationRate());
        assertEquals(9.1, result.getUnemploymentRate());
        assertEquals("2026-05-01", result.getLastUpdated());
    }

    @Test
    void macro_redisEmpty_returnsHardcodedFallback() {
        when(valueOps.get("market:economy:turkey")).thenReturn(null);

        EconomyDto result = service.getMacroEconomyData();

        // Fallback: 50.00 / 67.03 / 8.70 + bugünün tarihi
        assertEquals(50.00, result.getInterestRate());
        assertEquals(67.03, result.getInflationRate());
        assertEquals(8.70, result.getUnemploymentRate());
        assertNotNull(result.getLastUpdated());
    }

    @Test
    void macro_invalidJson_swallowsAndReturnsFallback() {
        when(valueOps.get("market:economy:turkey")).thenReturn("not valid json {");

        EconomyDto result = service.getMacroEconomyData();

        // Parse hatası → fallback dön
        assertEquals(50.00, result.getInterestRate());
    }

    @Test
    void macro_redisThrows_swallowsAndReturnsFallback() {
        when(valueOps.get("market:economy:turkey")).thenThrow(new RuntimeException("Redis down"));

        EconomyDto result = service.getMacroEconomyData();

        assertNotNull(result);
        assertEquals(67.03, result.getInflationRate());
    }

    // -------- getEconomyHistory --------

    @Test
    void history_redisEmpty_returnsEmptyList() {
        when(valueOps.get("evds:history:macro:CPI")).thenReturn(null);

        List<Map<String, Object>> result = service.getEconomyHistory("CPI", "1y");

        assertTrue(result.isEmpty());
    }

    @Test
    void history_filtersOutBeforeCutoff() {
        LocalDate today = LocalDate.now();
        LocalDate twoYearsAgo = today.minusYears(2);
        String json = String.format(
                "[{\"date\":\"%s\",\"value\":50.0},{\"date\":\"%s\",\"value\":60.0}]",
                twoYearsAgo, today
        );
        when(valueOps.get("evds:history:macro:CPI")).thenReturn(json);

        // 1y cutoff: sadece bugünki kayıt geçer
        List<Map<String, Object>> result = service.getEconomyHistory("CPI", "1y");

        assertEquals(1, result.size());
        assertEquals(today.toString(), result.get(0).get("date"));
    }

    @Test
    void history_allRange_includesEverything() {
        LocalDate today = LocalDate.now();
        LocalDate fiftyYearsAgo = today.minusYears(50);
        String json = String.format(
                "[{\"date\":\"%s\",\"value\":1.0},{\"date\":\"%s\",\"value\":2.0}]",
                fiftyYearsAgo, today
        );
        when(valueOps.get("evds:history:macro:CPI")).thenReturn(json);

        // 'all' = 100 yıl cutoff, ikisi de geçer
        List<Map<String, Object>> result = service.getEconomyHistory("CPI", "all");

        assertEquals(2, result.size());
    }

    @Test
    void history_invalidDateInRecord_skipsRecord() {
        LocalDate today = LocalDate.now();
        String json = String.format(
                "[{\"date\":\"not-a-date\",\"value\":1.0},{\"date\":\"%s\",\"value\":2.0}]",
                today
        );
        when(valueOps.get("evds:history:macro:CPI")).thenReturn(json);

        List<Map<String, Object>> result = service.getEconomyHistory("CPI", "1y");

        // Geçersiz date atılır
        assertEquals(1, result.size());
    }

    @Test
    void history_recordWithoutDate_skipped() {
        LocalDate today = LocalDate.now();
        String json = String.format(
                "[{\"value\":1.0},{\"date\":\"%s\",\"value\":2.0}]",
                today
        );
        when(valueOps.get("evds:history:macro:CPI")).thenReturn(json);

        List<Map<String, Object>> result = service.getEconomyHistory("CPI", "1y");

        assertEquals(1, result.size());
    }

    @Test
    void history_invalidJson_returnsEmptyList() {
        when(valueOps.get("evds:history:macro:CPI")).thenReturn("garbage");

        List<Map<String, Object>> result = service.getEconomyHistory("CPI", "1y");

        assertTrue(result.isEmpty());
    }

    @Test
    void history_ytdRange_cutoffIsJanFirst() {
        LocalDate today = LocalDate.now();
        LocalDate jan1 = LocalDate.of(today.getYear(), 1, 1);
        LocalDate lastYear = today.minusYears(1);

        String json = String.format(
                "[{\"date\":\"%s\",\"value\":1.0},{\"date\":\"%s\",\"value\":2.0}]",
                lastYear, jan1
        );
        when(valueOps.get("evds:history:macro:CPI")).thenReturn(json);

        List<Map<String, Object>> result = service.getEconomyHistory("CPI", "ytd");

        // YTD: sadece bu yılın ilk gününden bugüne kadar
        assertEquals(1, result.size());
        assertEquals(jan1.toString(), result.get(0).get("date"));
    }
}
