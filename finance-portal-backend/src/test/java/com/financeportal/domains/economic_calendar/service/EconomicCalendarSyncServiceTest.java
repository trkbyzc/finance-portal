package com.financeportal.domains.economic_calendar.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.financeportal.domains.economic_calendar.client.FinnhubEconomicCalendarClient;
import com.financeportal.domains.economic_calendar.dto.EconomicEventDto;
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
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EconomicCalendarSyncServiceTest {

    @Mock private FinnhubEconomicCalendarClient finnhubClient;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private BootstrapReadinessTracker bootstrapTracker;
    @Mock private com.financeportal.config.datasource.DataSourcePolicy dataSourcePolicy;

    @InjectMocks private EconomicCalendarSyncService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "objectMapper", new ObjectMapper().registerModule(new JavaTimeModule()));
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        // Mock varsayılanı false döner ve senkron erken çıkardı; bu testler kaynağın
        // açık olduğu durumu ölçüyor. Kapalı hali ayrı testte doğrulanıyor.
        when(dataSourcePolicy.isEnabled(anyString())).thenReturn(true);
    }

    /** Kaynak kapalıyken dış çağrı yapılmamalı ve önbelleğe dokunulmamalı. */
    @Test
    void sync_skipsEntirely_whenSourceDisabled() {
        when(dataSourcePolicy.isEnabled(anyString())).thenReturn(false);

        service.syncCalendar();

        verifyNoInteractions(finnhubClient);
        verify(valueOps, never()).set(anyString(), anyString(), anyLong(), any());
        // Açılış izleyicisi yine tamamlanmalı; aksi halde bootstrap sonsuz "bekliyor" kalır.
        verify(bootstrapTracker).markComplete("EconomicCalendar");
    }

    @Test
    void sync_validEvents_writesToRedis() {
        EconomicEventDto event = new EconomicEventDto();
        event.setId("US|CPI|2026-06-15");
        when(finnhubClient.fetchCalendar(any(LocalDate.class), any(LocalDate.class))).thenReturn(List.of(event));

        service.syncCalendar();

        verify(valueOps).set(eq("cache:economic-calendar"), anyString(), eq(21600L), eq(TimeUnit.SECONDS));
        verify(bootstrapTracker).markComplete("EconomicCalendar");
    }

    @Test
    void sync_emptyEvents_doesNotWriteCache() {
        when(finnhubClient.fetchCalendar(any(LocalDate.class), any(LocalDate.class))).thenReturn(List.of());

        service.syncCalendar();

        verify(valueOps, never()).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
        verify(bootstrapTracker).markComplete("EconomicCalendar");
    }

    @Test
    void sync_nullEvents_doesNotWriteCache() {
        when(finnhubClient.fetchCalendar(any(LocalDate.class), any(LocalDate.class))).thenReturn(null);

        service.syncCalendar();

        verify(valueOps, never()).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));
    }

    @Test
    void sync_finnhubThrows_markCompleteStillCalled() {
        when(finnhubClient.fetchCalendar(any(LocalDate.class), any(LocalDate.class)))
                .thenThrow(new RuntimeException("503"));

        service.syncCalendar();

        verify(bootstrapTracker).markComplete("EconomicCalendar");
    }

    @Test
    void sync_redisWriteThrows_markCompleteStillCalled() {
        EconomicEventDto event = new EconomicEventDto();
        when(finnhubClient.fetchCalendar(any(LocalDate.class), any(LocalDate.class))).thenReturn(List.of(event));
        org.mockito.Mockito.doThrow(new RuntimeException("Redis down"))
                .when(valueOps).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));

        service.syncCalendar();

        verify(bootstrapTracker).markComplete("EconomicCalendar");
    }

    @Test
    void sync_callsFinnhubWithCorrectDateWindow() {
        when(finnhubClient.fetchCalendar(any(LocalDate.class), any(LocalDate.class))).thenReturn(List.of());

        service.syncCalendar();

        // Window: today - 7 to today + 21
        org.mockito.ArgumentCaptor<LocalDate> fromCap = org.mockito.ArgumentCaptor.forClass(LocalDate.class);
        org.mockito.ArgumentCaptor<LocalDate> toCap = org.mockito.ArgumentCaptor.forClass(LocalDate.class);
        verify(finnhubClient).fetchCalendar(fromCap.capture(), toCap.capture());
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(fromCap.getValue(), toCap.getValue());
        org.junit.jupiter.api.Assertions.assertEquals(28, daysBetween);
    }
}
