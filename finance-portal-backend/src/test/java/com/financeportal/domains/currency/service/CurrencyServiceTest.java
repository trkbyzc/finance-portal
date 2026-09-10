package com.financeportal.domains.currency.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.financeportal.domains.currency.client.TcmbIntegrationClient;
import com.financeportal.service.cache.CacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
class CurrencyServiceTest {

    @Mock
    private TcmbIntegrationClient tcmbIntegrationClient;

    @Mock
    private CacheService cacheService;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOps;

    private CurrencyService service;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        service = new CurrencyService(tcmbIntegrationClient, cacheService, redisTemplate, objectMapper);
    }

    @Test
    void historical_emptyRedis_returnsEmptyList() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("evds:currency:USD")).thenReturn(null);

        List<Map<String, Object>> result = service.getCurrencyHistorical("USD", "1y");

        assertTrue(result.isEmpty());
    }

    @Test
    void historical_filtersOutOldDatesBeforeCutoff() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        // Veri: bir kayıt 2 yıl önce (1y cutoff'unun dışında), bir kayıt bugün (içinde)
        LocalDate today = LocalDate.now();
        LocalDate twoYearsAgo = today.minusYears(2);
        String json = String.format(
                "[{\"date\":\"%s\",\"close\":30.0},{\"date\":\"%s\",\"close\":35.0}]",
                twoYearsAgo, today
        );
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        List<Map<String, Object>> result = service.getCurrencyHistorical("USD", "1y");

        // Sadece bugünkü kayıt 1y cutoff'unun içinde
        assertEquals(1, result.size());
        assertEquals(today.toString(), result.get(0).get("date"));
    }

    @Test
    void historical_uppercasesCodeForRedisLookup() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("evds:currency:EUR")).thenReturn("[]");

        // Lowercase verilse de upper-case key ile aranmalı
        List<Map<String, Object>> result = service.getCurrencyHistorical("eur", "5y");

        // EUR (upper) key'i ile sorgulanıp boş [] dönmeli
        assertNotNull(result);
        assertTrue(result.isEmpty());
        org.mockito.Mockito.verify(valueOps).get("evds:currency:EUR");
    }

    @Test
    void historical_invalidJson_returnsEmptyListAndDoesNotThrow() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("evds:currency:USD")).thenReturn("this is not json");

        List<Map<String, Object>> result = service.getCurrencyHistorical("USD", "1y");

        // Parse hatası yutuldu, boş liste döndü — kullanıcıya 500 dönmez
        assertTrue(result.isEmpty());
    }

    @Test
    void historical_skipsRecordsWithoutDate() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        // Bir kaydın "date" alanı yok, diğeri var
        String json = String.format(
                "[{\"close\":30.0},{\"date\":\"%s\",\"close\":35.0}]",
                LocalDate.now()
        );
        when(valueOps.get("evds:currency:USD")).thenReturn(json);

        List<Map<String, Object>> result = service.getCurrencyHistorical("USD", "1y");

        // Date'i olmayan atılır, sadece 1 kayıt döner
        assertEquals(1, result.size());
    }

    @Test
    void getCurrencyRates_delegatesToCacheService() {
        when(cacheService.getOrFetch(org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.anyLong())).thenReturn(List.of());

        service.getCurrencyRates();

        // Cache service'in getOrFetch'i "cache:currencies" key'i ile çağrıldı
        org.mockito.Mockito.verify(cacheService).getOrFetch(
                org.mockito.ArgumentMatchers.eq("cache:currencies"),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.eq(60L)
        );
    }
}
