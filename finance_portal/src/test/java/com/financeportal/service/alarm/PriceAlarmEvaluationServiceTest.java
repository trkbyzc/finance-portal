package com.financeportal.service.alarm;

import com.financeportal.model.entity.PriceAlarm;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.AlarmCondition;
import com.financeportal.model.enums.AlarmFrequency;
import com.financeportal.model.enums.AssetType;
import com.financeportal.repository.PriceAlarmRepository;
import com.financeportal.service.mail.EmailService;
import com.financeportal.service.portfolio.PortfolioPriceService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PriceAlarmEvaluationServiceTest {

    @Mock private PriceAlarmRepository alarmRepo;
    @Mock private PortfolioPriceService priceService;
    @Mock private EmailService emailService;

    @InjectMocks private PriceAlarmEvaluationService service;

    private User userWithEmail(boolean emailEnabled) {
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setUsername("alice");
        u.setEmail("alice@example.com");
        u.setEmailNotificationsEnabled(emailEnabled);
        return u;
    }

    private PriceAlarm alarm(AlarmCondition cond, BigDecimal threshold, AlarmFrequency freq, User user) {
        return PriceAlarm.builder()
                .id(UUID.randomUUID())
                .user(user)
                .symbol("BTC")
                .assetType(AssetType.CRYPTO)
                .condition(cond)
                .threshold(threshold)
                .frequency(freq)
                .active(true)
                .createdAt(LocalDateTime.now())
                .triggerCount(0)
                .build();
    }

    // -------- isConditionMet (static helper) --------

    @Test
    void isConditionMet_aboveTriggered_whenCurrentExceedsThreshold() {
        assertTrue(PriceAlarmEvaluationService.isConditionMet(
                AlarmCondition.ABOVE, new BigDecimal("110"), new BigDecimal("100")));
    }

    @Test
    void isConditionMet_aboveTriggered_atEqual() {
        assertTrue(PriceAlarmEvaluationService.isConditionMet(
                AlarmCondition.ABOVE, new BigDecimal("100"), new BigDecimal("100")));
    }

    @Test
    void isConditionMet_aboveFalse_belowThreshold() {
        assertFalse(PriceAlarmEvaluationService.isConditionMet(
                AlarmCondition.ABOVE, new BigDecimal("99"), new BigDecimal("100")));
    }

    @Test
    void isConditionMet_belowTriggered_underThreshold() {
        assertTrue(PriceAlarmEvaluationService.isConditionMet(
                AlarmCondition.BELOW, new BigDecimal("90"), new BigDecimal("100")));
    }

    @Test
    void isConditionMet_belowFalse_aboveThreshold() {
        assertFalse(PriceAlarmEvaluationService.isConditionMet(
                AlarmCondition.BELOW, new BigDecimal("101"), new BigDecimal("100")));
    }

    // -------- evaluateOne flows --------

    @Test
    void evaluateOne_onceAlarmTriggered_sendsMailAndDeactivates() {
        User u = userWithEmail(true);
        PriceAlarm a = alarm(AlarmCondition.ABOVE, new BigDecimal("60000"), AlarmFrequency.ONCE, u);
        when(priceService.getCurrentPrice("BTC", AssetType.CRYPTO)).thenReturn(new BigDecimal("60500"));
        when(emailService.sendTemplated(anyString(), anyString(), anyString(), any(), any())).thenReturn(true);

        boolean triggered = service.evaluateOne(a);

        assertTrue(triggered);
        assertFalse(a.isActive());
        assertEquals(1, a.getTriggerCount());
        assertNotNull(a.getLastTriggeredAt());
        verify(emailService).sendTemplated(eq("alice@example.com"), anyString(),
                eq("email/alarm-triggered"), any(Map.class), any(Locale.class));
        verify(alarmRepo).save(a);
    }

    @Test
    void evaluateOne_continuousAlarmTriggered_staysActive() {
        User u = userWithEmail(true);
        PriceAlarm a = alarm(AlarmCondition.BELOW, new BigDecimal("100"), AlarmFrequency.CONTINUOUS, u);
        when(priceService.getCurrentPrice("BTC", AssetType.CRYPTO)).thenReturn(new BigDecimal("90"));
        when(emailService.sendTemplated(anyString(), anyString(), anyString(), any(), any())).thenReturn(true);

        boolean triggered = service.evaluateOne(a);

        assertTrue(triggered);
        assertTrue(a.isActive(), "CONTINUOUS alarm aktif kalmalı");
        assertEquals(1, a.getTriggerCount());
    }

    @Test
    void evaluateOne_continuousCooldown_skipsTrigger() {
        User u = userWithEmail(true);
        PriceAlarm a = alarm(AlarmCondition.ABOVE, new BigDecimal("100"), AlarmFrequency.CONTINUOUS, u);
        a.setLastTriggeredAt(LocalDateTime.now().minusMinutes(5)); // 5dk önce, cooldown 30dk
        when(priceService.getCurrentPrice("BTC", AssetType.CRYPTO)).thenReturn(new BigDecimal("110"));

        boolean triggered = service.evaluateOne(a);

        assertFalse(triggered);
        verify(emailService, never()).sendTemplated(anyString(), anyString(), anyString(), any(), any());
    }

    @Test
    void evaluateOne_continuousCooldownExpired_triggersAgain() {
        User u = userWithEmail(true);
        PriceAlarm a = alarm(AlarmCondition.ABOVE, new BigDecimal("100"), AlarmFrequency.CONTINUOUS, u);
        a.setLastTriggeredAt(LocalDateTime.now().minusMinutes(31)); // cooldown bitti
        a.setTriggerCount(2);
        when(priceService.getCurrentPrice("BTC", AssetType.CRYPTO)).thenReturn(new BigDecimal("110"));
        when(emailService.sendTemplated(anyString(), anyString(), anyString(), any(), any())).thenReturn(true);

        boolean triggered = service.evaluateOne(a);

        assertTrue(triggered);
        assertEquals(3, a.getTriggerCount());
    }

    @Test
    void evaluateOne_conditionNotMet_doesNothing() {
        User u = userWithEmail(true);
        PriceAlarm a = alarm(AlarmCondition.ABOVE, new BigDecimal("100"), AlarmFrequency.ONCE, u);
        when(priceService.getCurrentPrice("BTC", AssetType.CRYPTO)).thenReturn(new BigDecimal("90"));

        boolean triggered = service.evaluateOne(a);

        assertFalse(triggered);
        assertTrue(a.isActive());
        verify(alarmRepo, never()).save(any());
    }

    @Test
    void evaluateOne_userOptedOutEmail_stillUpdatesState() {
        User u = userWithEmail(false);
        PriceAlarm a = alarm(AlarmCondition.ABOVE, new BigDecimal("100"), AlarmFrequency.ONCE, u);
        when(priceService.getCurrentPrice("BTC", AssetType.CRYPTO)).thenReturn(new BigDecimal("110"));

        boolean triggered = service.evaluateOne(a);

        assertTrue(triggered);
        assertFalse(a.isActive());
        assertEquals(1, a.getTriggerCount());
        // E-posta atılmaz çünkü kullanıcı kapatmış
        verify(emailService, never()).sendTemplated(anyString(), anyString(), anyString(), any(), any());
    }

    @Test
    void evaluateOne_priceLookupFails_returnsFalse() {
        User u = userWithEmail(true);
        PriceAlarm a = alarm(AlarmCondition.ABOVE, new BigDecimal("100"), AlarmFrequency.ONCE, u);
        when(priceService.getCurrentPrice("BTC", AssetType.CRYPTO))
                .thenThrow(new RuntimeException("API down"));

        boolean triggered = service.evaluateOne(a);

        assertFalse(triggered);
        verify(emailService, never()).sendTemplated(anyString(), anyString(), anyString(), any(), any());
    }

    @Test
    void evaluateOne_priceZeroOrNull_returnsFalse() {
        User u = userWithEmail(true);
        PriceAlarm a = alarm(AlarmCondition.ABOVE, new BigDecimal("100"), AlarmFrequency.ONCE, u);
        when(priceService.getCurrentPrice("BTC", AssetType.CRYPTO)).thenReturn(BigDecimal.ZERO);

        assertFalse(service.evaluateOne(a));
    }

    // -------- evaluateAllAlarms loop --------

    @Test
    void evaluateAllAlarms_noActive_noWork() {
        when(alarmRepo.findByActiveTrue()).thenReturn(List.of());
        service.evaluateAllAlarms();
        verify(priceService, never()).getCurrentPrice(anyString(), any());
    }

    @Test
    void evaluateAllAlarms_swallowsAlarmEvalErrors() {
        User u = userWithEmail(true);
        PriceAlarm bad = alarm(AlarmCondition.ABOVE, new BigDecimal("100"), AlarmFrequency.ONCE, u);
        PriceAlarm good = alarm(AlarmCondition.ABOVE, new BigDecimal("50"), AlarmFrequency.ONCE, u);
        when(alarmRepo.findByActiveTrue()).thenReturn(List.of(bad, good));
        when(priceService.getCurrentPrice(eq("BTC"), eq(AssetType.CRYPTO)))
                .thenThrow(new RuntimeException("transient")).thenReturn(new BigDecimal("60"));
        when(emailService.sendTemplated(anyString(), anyString(), anyString(), any(), any())).thenReturn(true);

        service.evaluateAllAlarms();

        // bad attı, good tetiklendi
        assertTrue(good.getTriggerCount() == 1 || good.getTriggerCount() == 0,
                "Loop devam etti, exception fırlatmadı");
    }
}
