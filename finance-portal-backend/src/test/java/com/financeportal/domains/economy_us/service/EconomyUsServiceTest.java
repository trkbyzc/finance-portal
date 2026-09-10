package com.financeportal.domains.economy_us.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.economy_us.dto.EconomyUsDto;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EconomyUsServiceTest {

    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;

    private EconomyUsService service;

    @BeforeEach
    void setUp() {
        service = new EconomyUsService(redisTemplate, new ObjectMapper());
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    // -------- getMacroEconomyData --------

    @Test
    void getMacro_redisHasSnapshot_returnsParsed() {
        when(valueOps.get("market:economy:usa"))
                .thenReturn("{\"cpiIndex\":308.4,\"yoyChangePct\":3.1,\"lastUpdated\":\"2026-06-01\"}");

        EconomyUsDto result = service.getMacroEconomyData();

        assertEquals(308.4, result.getCpiIndex());
        assertEquals(3.1, result.getYoyChangePct());
        assertEquals("2026-06-01", result.getLastUpdated());
    }

    @Test
    void getMacro_redisEmpty_returnsDefault() {
        when(valueOps.get("market:economy:usa")).thenReturn(null);

        EconomyUsDto result = service.getMacroEconomyData();
        assertNull(result.getCpiIndex());
        assertNull(result.getYoyChangePct());
        assertNotNull(result.getLastUpdated());
    }

    @Test
    void getMacro_invalidJson_returnsDefault() {
        when(valueOps.get("market:economy:usa")).thenReturn("garbage");

        EconomyUsDto result = service.getMacroEconomyData();
        assertNull(result.getCpiIndex());
    }

    @Test
    void getMacro_redisThrows_returnsDefault() {
        when(valueOps.get("market:economy:usa")).thenThrow(new RuntimeException("Redis down"));

        EconomyUsDto result = service.getMacroEconomyData();
        assertNull(result.getCpiIndex());
    }

    // -------- getEconomyHistory --------

    @Test
    void getHistory_redisEmpty_returnsEmpty() {
        when(valueOps.get("evds:history:macro:usdInflationRate")).thenReturn(null);

        assertTrue(service.getEconomyHistory("1y").isEmpty());
    }

    @Test
    void getHistory_validData_returnsFilteredByRange() {
        LocalDate today = LocalDate.now();
        LocalDate longAgo = today.minusYears(2);
        String json = String.format(
                "[{\"date\":\"%s\",\"value\":300},{\"date\":\"%s\",\"value\":310}]",
                longAgo, today);
        when(valueOps.get("evds:history:macro:usdInflationRate")).thenReturn(json);

        List<Map<String, Object>> result = service.getEconomyHistory("1y");

        // longAgo (2yıl önce) cutoff (1y) öncesi → filtre dışı
        assertEquals(1, result.size());
    }

    @Test
    void getHistory_allRange_includesEverything() {
        LocalDate today = LocalDate.now();
        LocalDate longAgo = today.minusYears(50);
        String json = String.format(
                "[{\"date\":\"%s\",\"value\":300},{\"date\":\"%s\",\"value\":310}]",
                longAgo, today);
        when(valueOps.get("evds:history:macro:usdInflationRate")).thenReturn(json);

        List<Map<String, Object>> result = service.getEconomyHistory("all");

        assertEquals(2, result.size());
    }

    @Test
    void getHistory_pointWithoutDate_skipped() {
        LocalDate today = LocalDate.now();
        String json = String.format(
                "[{\"value\":100},{\"date\":\"%s\",\"value\":200}]", today);
        when(valueOps.get("evds:history:macro:usdInflationRate")).thenReturn(json);

        List<Map<String, Object>> result = service.getEconomyHistory("1y");
        assertEquals(1, result.size());
    }

    @Test
    void getHistory_invalidDate_skipped() {
        LocalDate today = LocalDate.now();
        String json = String.format(
                "[{\"date\":\"not-a-date\",\"value\":100},{\"date\":\"%s\",\"value\":200}]", today);
        when(valueOps.get("evds:history:macro:usdInflationRate")).thenReturn(json);

        List<Map<String, Object>> result = service.getEconomyHistory("1y");
        assertEquals(1, result.size());
    }

    @Test
    void getHistory_invalidJson_returnsEmpty() {
        when(valueOps.get("evds:history:macro:usdInflationRate")).thenReturn("garbage");

        assertTrue(service.getEconomyHistory("1y").isEmpty());
    }

    @Test
    void getHistory_variousRanges_correctCutoff() {
        LocalDate today = LocalDate.now();
        LocalDate longAgo = today.minusYears(30);
        String json = String.format(
                "[{\"date\":\"%s\",\"value\":100},{\"date\":\"%s\",\"value\":200}]",
                longAgo, today);
        when(valueOps.get("evds:history:macro:usdInflationRate")).thenReturn(json);

        // All these are 1+ filter → today included, longAgo excluded
        assertEquals(1, service.getEconomyHistory("1mo").size());
        assertEquals(1, service.getEconomyHistory("3mo").size());
        assertEquals(1, service.getEconomyHistory("6mo").size());
        assertEquals(1, service.getEconomyHistory("ytd").size());
        assertEquals(1, service.getEconomyHistory("1y").size());
        assertEquals(1, service.getEconomyHistory("5y").size());
        assertEquals(1, service.getEconomyHistory("10y").size());
        assertEquals(1, service.getEconomyHistory("unknown").size()); // default 10y
        assertEquals(1, service.getEconomyHistory(null).size()); // null → 10y
        assertEquals(2, service.getEconomyHistory("all").size()); // 100y → both
    }

    @Test
    void getHistory_turkishAliases_handled() {
        LocalDate today = LocalDate.now();
        String json = String.format("[{\"date\":\"%s\",\"value\":100}]", today);
        when(valueOps.get("evds:history:macro:usdInflationRate")).thenReturn(json);

        assertEquals(1, service.getEconomyHistory("1a").size());
        assertEquals(1, service.getEconomyHistory("3a").size());
        assertEquals(1, service.getEconomyHistory("6a").size());
    }
}
