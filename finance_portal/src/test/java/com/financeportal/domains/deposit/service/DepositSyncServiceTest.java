package com.financeportal.domains.deposit.service;

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
class DepositSyncServiceTest {

    @Mock private EvdsClient evdsClient;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private BootstrapReadinessTracker bootstrapTracker;

    @InjectMocks private DepositSyncService service;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    private JsonNode node(double value) {
        ObjectNode n = new ObjectMapper().createObjectNode();
        n.put("TP_TRY_MT01", value);
        return n;
    }

    @Test
    void sync_validData_writesEachKeyToRedis() {
        when(evdsClient.fetchSeries(any(), any(), any(), any()))
                .thenReturn(List.of(node(45.5), node(46.0)));
        when(evdsClient.extractValueFromNode(any(), anyString())).thenReturn(45.5, 46.0);

        service.syncDeposits();

        // 5 deposit key (32, 92, 181, 365, 365_plus) yazılır
        verify(valueOps, atLeastOnce()).set(anyString(), anyString(), eq(86400L), eq(TimeUnit.SECONDS));
        verify(bootstrapTracker).markComplete("Deposit");
    }

    @Test
    void sync_lastValueWins_evenIfMultiplePoints() {
        when(evdsClient.fetchSeries(any(), any(), any(), any()))
                .thenReturn(List.of(node(40.0), node(45.0), node(50.0)));
        // İlk gelen 40, sonra 45, sonra 50 — en son geçerli olan 50 yazılır
        when(evdsClient.extractValueFromNode(any(), anyString())).thenReturn(40.0, 45.0, 50.0);

        service.syncDeposits();

        verify(valueOps).set("evds:deposit:32", "50.0", 86400L, TimeUnit.SECONDS);
    }

    @Test
    void sync_evdsEmpty_doesNotWrite() {
        when(evdsClient.fetchSeries(any(), any(), any(), any())).thenReturn(List.of());

        service.syncDeposits();

        verify(valueOps, never()).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
        verify(bootstrapTracker).markComplete("Deposit");
    }

    @Test
    void sync_allValuesNull_doesNotWrite() {
        when(evdsClient.fetchSeries(any(), any(), any(), any())).thenReturn(List.of(node(0)));
        when(evdsClient.extractValueFromNode(any(), anyString())).thenReturn(null);

        service.syncDeposits();

        verify(valueOps, never()).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
        verify(bootstrapTracker).markComplete("Deposit");
    }

    @Test
    void sync_evdsThrows_markCompleteStillCalled() {
        when(evdsClient.fetchSeries(any(), any(), any(), any())).thenThrow(new RuntimeException("EVDS down"));

        try { service.syncDeposits(); } catch (Exception ignored) { /* test scenario: swallow expected exception */ }

        verify(bootstrapTracker).markComplete("Deposit");
    }
}
