package com.financeportal.domains.turkish_bond.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.financeportal.client.EvdsClient;
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
class TurkishBondSyncServiceTest {

    @Mock private EvdsClient evdsClient;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private BootstrapReadinessTracker bootstrapTracker;

    @InjectMocks private TurkishBondSyncService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "objectMapper", new ObjectMapper());
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    private JsonNode node(String date, double rate, String code) {
        ObjectNode n = new ObjectMapper().createObjectNode();
        n.put("Tarih", date);
        n.put(code.replace(".", "_"), rate);
        return n;
    }

    @Test
    void sync_validData_writesEachBondToTwoRedisKeys() {
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class)))
                .thenReturn(List.of(node("01-01-2024", 30.0, "TP.TRD080726K10")));
        when(evdsClient.extractValueFromNode(any(), anyString())).thenReturn(30.0);

        service.syncTurkishBonds();

        // Her tahvil için hem benchmark hem evds:history key'i yazılır
        verify(valueOps, atLeastOnce()).set(eq("evds:benchmark:1m"), anyString(), eq(86400L), eq(TimeUnit.SECONDS));
        verify(valueOps, atLeastOnce()).set(eq("evds:history:TP.TRD080726K10"), anyString(), eq(86400L), eq(TimeUnit.SECONDS));
        verify(bootstrapTracker).markComplete("TurkishBonds");
    }

    @Test
    void sync_evdsEmpty_doesNotWriteRedis() {
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class))).thenReturn(List.of());

        service.syncTurkishBonds();

        verify(valueOps, never()).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
        verify(bootstrapTracker).markComplete("TurkishBonds");
    }

    @Test
    void sync_nullValue_skipsRecord() {
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class)))
                .thenReturn(List.of(node("01-01-2024", 0, "TP.X")));
        when(evdsClient.extractValueFromNode(any(), anyString())).thenReturn(null);

        service.syncTurkishBonds();

        // val null → history boş → redis write yok
        verify(valueOps, never()).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
        verify(bootstrapTracker).markComplete("TurkishBonds");
    }

    @Test
    void sync_invalidDateFormat_skipsRecord() {
        ObjectNode badDate = new ObjectMapper().createObjectNode();
        badDate.put("Tarih", "not-a-date");
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class)))
                .thenReturn(List.of((JsonNode) badDate));
        when(evdsClient.extractValueFromNode(any(), anyString())).thenReturn(30.0);

        service.syncTurkishBonds();

        verify(valueOps, never()).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
        verify(bootstrapTracker).markComplete("TurkishBonds");
    }

    @Test
    void sync_alwaysMarksBootstrapComplete() {
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class)))
                .thenThrow(new RuntimeException("EVDS down"));

        try { service.syncTurkishBonds(); } catch (Exception ignored) { /* test scenario: swallow expected exception */ }

        verify(bootstrapTracker).markComplete("TurkishBonds");
    }
}
