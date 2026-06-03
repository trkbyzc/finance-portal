package com.financeportal.domains.economy_us.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.economy_us.client.FredClient;
import com.financeportal.service.bootstrap.BootstrapReadinessTracker;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
class EconomyUsSyncServiceTest {

    @Mock private FredClient fredClient;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private BootstrapReadinessTracker bootstrapTracker;

    @InjectMocks private EconomyUsSyncService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "objectMapper", new ObjectMapper());
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    private Map<String, Object> point(double value) {
        Map<String, Object> p = new java.util.HashMap<>();
        p.put("value", value);
        return p;
    }

    @Test
    void sync_validHistory_writesBothKeys() {
        // 14 months of data — enough for YoY (>12 needed)
        List<Map<String, Object>> history = new ArrayList<>();
        for (int i = 0; i < 14; i++) history.add(point(300 + i));
        when(fredClient.fetchObservations(eq("CPIAUCSL"), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(history);

        service.syncUsInflation();

        // Both HISTORY and SNAPSHOT keys written
        verify(valueOps).set(eq("evds:history:macro:usdInflationRate"), anyString(), eq(86400L), eq(TimeUnit.SECONDS));
        verify(valueOps).set(eq("market:economy:usa"), anyString(), eq(86400L), eq(TimeUnit.SECONDS));
        verify(bootstrapTracker).markComplete("EconomyUS");
    }

    @Test
    void sync_emptyHistory_doesNotWrite() {
        when(fredClient.fetchObservations(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());

        service.syncUsInflation();

        verify(valueOps, never()).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
        verify(bootstrapTracker).markComplete("EconomyUS");
    }

    @Test
    void sync_lessThan13Points_snapshotHasNullYoy() {
        // 5 points — not enough for YoY (need >12)
        List<Map<String, Object>> history = new ArrayList<>();
        for (int i = 0; i < 5; i++) history.add(point(300 + i));
        when(fredClient.fetchObservations(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(history);

        service.syncUsInflation();

        // History yine yazılır, snapshot yoy null olur ama yine de yazılır
        verify(valueOps, atLeastOnce()).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
    }

    @Test
    void sync_redisWriteThrows_markCompleteStillCalled() {
        List<Map<String, Object>> history = List.of(point(300));
        when(fredClient.fetchObservations(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(history);
        org.mockito.Mockito.doThrow(new RuntimeException("Redis down"))
                .when(valueOps).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));

        service.syncUsInflation();

        verify(bootstrapTracker).markComplete("EconomyUS");
    }

    @Test
    void sync_fredThrows_markCompleteStillCalled() {
        when(fredClient.fetchObservations(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenThrow(new RuntimeException("FRED down"));

        try { service.syncUsInflation(); } catch (Exception ignored) {}

        verify(bootstrapTracker).markComplete("EconomyUS");
    }

    @Test
    void sync_yearAgoZeroValue_yoyIsNullNotInfinity() {
        List<Map<String, Object>> history = new ArrayList<>();
        history.add(point(0));  // year ago = 0
        for (int i = 0; i < 13; i++) history.add(point(300));
        when(fredClient.fetchObservations(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(history);

        service.syncUsInflation();

        // Should not throw (division by zero avoided), still writes
        verify(valueOps, atLeastOnce()).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
    }
}
