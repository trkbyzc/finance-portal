package com.financeportal.domains.currency.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.financeportal.client.EvdsClient;
import com.financeportal.domains.currency.client.TcmbIntegrationClient;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.service.bootstrap.BootstrapReadinessTracker;
import com.financeportal.service.cache.CacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CurrencySyncServiceTest {

    @Mock private TcmbIntegrationClient tcmbClient;
    @Mock private EvdsClient evdsClient;
    @Mock private CacheService cacheService;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private BootstrapReadinessTracker bootstrapTracker;

    @InjectMocks private CurrencySyncService service;

    @BeforeEach
    void setUp() {
        // Use real ObjectMapper for JSON serialization
        org.springframework.test.util.ReflectionTestUtils.setField(service, "objectMapper", new ObjectMapper());
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    private JsonNode evdsNode(String date, double value) {
        ObjectNode node = new ObjectMapper().createObjectNode();
        node.put("Tarih", date);
        node.put("TP_DK_USD_S_YTL", value);
        return node;
    }

    @Test
    void sync_evdsAllCached_skipsEvdsFetch() {
        // All currencies already cached → no EVDS calls
        when(redisTemplate.hasKey(anyString())).thenReturn(true);
        when(tcmbClient.fetchTcmbCurrencyRates()).thenReturn(List.of());

        service.fetchAndCacheCurrencyRates();

        verify(evdsClient, never()).fetchSeriesPaginated(any(), any(), any(), any(int.class));
        verify(bootstrapTracker).markComplete("Currency");
    }

    @Test
    void sync_cacheMiss_fetchesEvds() {
        // Cache miss → EVDS called
        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class)))
                .thenReturn(List.of(evdsNode("01-01-2024", 33.0), evdsNode("02-01-2024", 33.5)));
        when(evdsClient.extractValueFromNode(any(), anyString())).thenReturn(33.0).thenReturn(33.5);
        when(tcmbClient.fetchTcmbCurrencyRates()).thenReturn(List.of());

        service.fetchAndCacheCurrencyRates();

        // 12 currencies in EVDS_CURRENCIES → EVDS called at least once per
        verify(evdsClient, atLeastOnce()).fetchSeriesPaginated(any(), any(), any(), any(int.class));
        verify(bootstrapTracker).markComplete("Currency");
    }

    @Test
    void sync_evdsReturnsEmpty_doesNotWriteRedisHistory() {
        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class))).thenReturn(List.of());
        when(tcmbClient.fetchTcmbCurrencyRates()).thenReturn(List.of());

        service.fetchAndCacheCurrencyRates();

        // EVDS empty → no historyList write
        verify(valueOps, never()).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
    }

    @Test
    void sync_evdsThrows_continuesAndMarksComplete() {
        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class)))
                .thenThrow(new RuntimeException("EVDS down"));
        when(tcmbClient.fetchTcmbCurrencyRates()).thenReturn(List.of());

        service.fetchAndCacheCurrencyRates();

        verify(bootstrapTracker).markComplete("Currency");
    }

    @Test
    void sync_tcmbRatesNonEmpty_savesCache() {
        when(redisTemplate.hasKey(anyString())).thenReturn(true);
        CurrencyDto usd = new CurrencyDto();
        usd.setCurrencyCode("USD");
        when(tcmbClient.fetchTcmbCurrencyRates()).thenReturn(List.of(usd));

        service.fetchAndCacheCurrencyRates();

        verify(cacheService).save(eq("cache:currencies"), any(), eq(60L));
    }

    @Test
    void sync_tcmbRatesEmpty_doesNotSaveCache() {
        when(redisTemplate.hasKey(anyString())).thenReturn(true);
        when(tcmbClient.fetchTcmbCurrencyRates()).thenReturn(List.of());

        service.fetchAndCacheCurrencyRates();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void sync_tcmbRatesNull_doesNotSaveCache() {
        when(redisTemplate.hasKey(anyString())).thenReturn(true);
        when(tcmbClient.fetchTcmbCurrencyRates()).thenReturn(null);

        service.fetchAndCacheCurrencyRates();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void sync_evdsHistoryWritten_correctRedisKeys() {
        when(redisTemplate.hasKey("evds:currency:USD")).thenReturn(false);
        when(redisTemplate.hasKey("evds:currency:EUR")).thenReturn(true); // EUR cached, USD not
        when(redisTemplate.hasKey(org.mockito.ArgumentMatchers.argThat(
                key -> key != null && !key.equals("evds:currency:USD") && !key.equals("evds:currency:EUR"))))
                .thenReturn(true);

        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class)))
                .thenReturn(List.of(evdsNode("01-01-2024", 33.0)));
        when(evdsClient.extractValueFromNode(any(), anyString())).thenReturn(33.0);
        when(tcmbClient.fetchTcmbCurrencyRates()).thenReturn(List.of());

        service.fetchAndCacheCurrencyRates();

        // USD historyList written, EUR skipped
        verify(valueOps).set(eq("evds:currency:USD"), anyString(), eq(86400L), eq(TimeUnit.SECONDS));
    }

    @Test
    void sync_alwaysMarksBootstrapComplete() {
        // Even if everything fails, markComplete called via finally
        when(redisTemplate.hasKey(anyString())).thenThrow(new RuntimeException("redis down"));
        when(tcmbClient.fetchTcmbCurrencyRates()).thenThrow(new RuntimeException("tcmb down"));

        try {
            service.fetchAndCacheCurrencyRates();
        } catch (Exception ignored) { /* test scenario: swallow expected exception */ }

        // Even on exception, markComplete must be called via try-finally
        verify(bootstrapTracker).markComplete("Currency");
    }

    @Test
    void sync_dateParseFailures_skippedNotFatal() {
        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        // Invalid date format
        ObjectNode badDate = new ObjectMapper().createObjectNode();
        badDate.put("Tarih", "not-a-date");
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class)))
                .thenReturn(List.of(badDate));
        when(evdsClient.extractValueFromNode(any(), anyString())).thenReturn(33.0);
        when(tcmbClient.fetchTcmbCurrencyRates()).thenReturn(List.of());

        service.fetchAndCacheCurrencyRates();

        // Invalid date → historyList stays empty → no redis write
        verify(bootstrapTracker).markComplete("Currency");
    }
}
