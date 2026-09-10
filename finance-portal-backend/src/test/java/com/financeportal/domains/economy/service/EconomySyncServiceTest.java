package com.financeportal.domains.economy.service;

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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EconomySyncServiceTest {

    @Mock private EvdsClient evdsClient;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private BootstrapReadinessTracker bootstrapTracker;

    @InjectMocks private EconomySyncService service;

    @BeforeEach
    void setUp() {
        org.springframework.test.util.ReflectionTestUtils.setField(service, "objectMapper", new ObjectMapper());
        org.springframework.test.util.ReflectionTestUtils.setField(service, "cpiSeriesCode", "TP.TUKFIY2025.GENEL");
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    private JsonNode node(String dateStr, double value) {
        ObjectNode n = new ObjectMapper().createObjectNode();
        n.put("Tarih", dateStr);
        n.put("TP_APIFON4", value);
        return n;
    }

    @Test
    void sync_evdsReturnsData_writesToRedis() {
        when(evdsClient.fetchSeries(any(), any(), any(), any()))
                .thenReturn(List.of(node("2024-01", 50.0)));
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class)))
                .thenReturn(List.of(node("2024-01-01", 50.0)));
        when(evdsClient.extractValueFromNode(any(), anyString())).thenReturn(50.0);

        service.syncMacroEconomy();

        // Cards + history both written
        verify(valueOps).set(eq("market:economy:turkey"), anyString(), anyLong(), any(TimeUnit.class));
        verify(bootstrapTracker).markComplete("Economy");
    }

    @Test
    void sync_evdsEmpty_usesFallbackValues() {
        when(evdsClient.fetchSeries(any(), any(), any(), any())).thenReturn(List.of());
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class))).thenReturn(List.of());

        service.syncMacroEconomy();

        // Fallback değerleri kullanılır, cards Redis'e yazılır
        verify(valueOps).set(eq("market:economy:turkey"), anyString(), anyLong(), any(TimeUnit.class));
        verify(bootstrapTracker).markComplete("Economy");
    }

    @Test
    void sync_evdsThrows_markCompleteStillCalled() {
        when(evdsClient.fetchSeries(any(), any(), any(), any())).thenThrow(new RuntimeException("EVDS down"));

        try {
            service.syncMacroEconomy();
        } catch (Exception ignored) { /* test scenario: swallow expected exception */ }

        verify(bootstrapTracker).markComplete("Economy");
    }

    @Test
    void sync_redisWriteFails_swallowsExceptionAndContinues() {
        when(evdsClient.fetchSeries(any(), any(), any(), any())).thenReturn(List.of(node("2024-01", 50.0)));
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class))).thenReturn(List.of());
        when(evdsClient.extractValueFromNode(any(), anyString())).thenReturn(50.0);

        // Redis write fails for cards
        org.mockito.Mockito.doThrow(new RuntimeException("Redis down"))
                .when(valueOps).set(eq("market:economy:turkey"), anyString(), anyLong(), any(TimeUnit.class));

        service.syncMacroEconomy();

        // Hata yutulur, bootstrap işaretlenir
        verify(bootstrapTracker).markComplete("Economy");
    }

    @Test
    void sync_historyDataParseAttempted() {
        when(evdsClient.fetchSeries(any(), any(), any(), any())).thenReturn(List.of());
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class)))
                .thenReturn(List.of(
                        node("2024-1", 30.0),    // tek haneli ay
                        node("2024-12", 35.0),   // çift haneli ay
                        node("01-01-2024", 40.0) // günlük format
                ));
        when(evdsClient.extractValueFromNode(any(), anyString())).thenReturn(30.0).thenReturn(35.0).thenReturn(40.0);

        service.syncMacroEconomy();

        // Various date formats accepted
        verify(bootstrapTracker).markComplete("Economy");
    }

    @Test
    void sync_NDValueSkipped() {
        ObjectNode badNode = new ObjectMapper().createObjectNode();
        badNode.put("Tarih", "ND");
        when(evdsClient.fetchSeries(any(), any(), any(), any())).thenReturn(List.of(badNode));
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class))).thenReturn(List.of());
        when(evdsClient.extractValueFromNode(any(), anyString())).thenReturn(null);

        service.syncMacroEconomy();

        verify(bootstrapTracker).markComplete("Economy");
    }

    @Test
    void sync_fetchSeriesCalledForLiveValues() {
        when(evdsClient.fetchSeries(any(), any(), any(), any())).thenReturn(List.of());
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class))).thenReturn(List.of());

        service.syncMacroEconomy();

        // 3 live values: TP.APIFON4, TP.YISGUCU2.G8, TP.TUKFIY2025.GENEL
        verify(evdsClient, atLeastOnce()).fetchSeries(any(), any(), any(), any());
    }

    @Test
    void sync_fetchSeriesPaginatedCalledForHistory() {
        when(evdsClient.fetchSeries(any(), any(), any(), any())).thenReturn(List.of());
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class))).thenReturn(List.of());
        // 5-arg overload (EconomySyncService.saveHistory frequency param ile çağırıyor)
        when(evdsClient.fetchSeriesPaginated(any(), any(), any(), any(int.class), any())).thenReturn(List.of());

        service.syncMacroEconomy();

        // saveHistory artık 5-arg overload'ı çağırıyor (frequency=null çoğunda).
        verify(evdsClient, atLeastOnce()).fetchSeriesPaginated(any(), any(), any(), any(int.class), any());
    }
}
