package com.financeportal.service.alarm;

import com.financeportal.model.entity.PriceAlarm;
import com.financeportal.model.entity.User;
import com.financeportal.model.enums.AlarmCondition;
import com.financeportal.model.enums.AlarmFrequency;
import com.financeportal.repository.PriceAlarmRepository;
import com.financeportal.service.mail.EmailService;
import com.financeportal.service.portfolio.PortfolioPriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Aktif fiyat alarmlarını periyodik tarayan değerlendirme servisi.
 *
 * Her tur:
 *   1. Aktif alarmları çek
 *   2. Her biri için anlık fiyatı (PortfolioPriceService) al
 *   3. Koşul (ABOVE/BELOW) karşılanmışsa → e-posta gönder + state güncelle
 *      - ONCE: active=false, lastTriggeredAt set
 *      - CONTINUOUS: lastTriggeredAt set, triggerCount++ (cooldown korunur)
 *
 * Cooldown: CONTINUOUS alarmlarda aynı koşul peş peşe spam olmasın diye 30dk.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PriceAlarmEvaluationService {

    private static final Duration CONTINUOUS_COOLDOWN = Duration.ofMinutes(30);

    private final PriceAlarmRepository alarmRepo;
    private final PortfolioPriceService priceService;
    private final EmailService emailService;

    @Scheduled(fixedRateString = "${app.alarm.eval-rate-ms:120000}", initialDelayString = "${app.alarm.eval-rate-ms:120000}")
    @Transactional
    public void evaluateAllAlarms() {
        List<PriceAlarm> active = alarmRepo.findByActiveTrue();
        if (active.isEmpty()) return;

        long startTime = System.currentTimeMillis();
        int triggered = 0;
        for (PriceAlarm alarm : active) {
            try {
                if (evaluateOne(alarm)) triggered++;
            } catch (Exception e) {
                log.warn("[ALARM_EVAL] {} alarm değerlendirme hatası: {}", alarm.getId(), e.getMessage());
            }
        }
        if (triggered > 0) {
            log.info("[ALARM_EVAL] {} alarm tetiklendi (toplam aktif {}, süre {}ms).",
                    triggered, active.size(), System.currentTimeMillis() - startTime);
        }
    }

    /** Tek alarm: koşul karşılanırsa tetikle ve state güncelle. */
    boolean evaluateOne(PriceAlarm alarm) {
        BigDecimal current = safePrice(alarm);
        if (current == null || current.signum() <= 0) return false;

        boolean conditionMet = isConditionMet(alarm.getCondition(), current, alarm.getThreshold());
        if (!conditionMet) return false;

        // CONTINUOUS cooldown: son tetik 30dk içindeyse spam etme
        if (alarm.getFrequency() == AlarmFrequency.CONTINUOUS
                && alarm.getLastTriggeredAt() != null
                && Duration.between(alarm.getLastTriggeredAt(), LocalDateTime.now()).compareTo(CONTINUOUS_COOLDOWN) < 0) {
            return false;
        }

        notifyUser(alarm, current);
        alarm.setLastTriggeredAt(LocalDateTime.now());
        alarm.setTriggerCount(alarm.getTriggerCount() + 1);
        if (alarm.getFrequency() == AlarmFrequency.ONCE) {
            alarm.setActive(false);
        }
        alarmRepo.save(alarm);
        return true;
    }

    private BigDecimal safePrice(PriceAlarm alarm) {
        try {
            return priceService.getCurrentPrice(alarm.getSymbol(), alarm.getAssetType());
        } catch (Exception e) {
            log.debug("[ALARM_EVAL] {} için fiyat alınamadı: {}", alarm.getSymbol(), e.getMessage());
            return null;
        }
    }

    static boolean isConditionMet(AlarmCondition cond, BigDecimal current, BigDecimal threshold) {
        if (cond == AlarmCondition.ABOVE) return current.compareTo(threshold) >= 0;
        if (cond == AlarmCondition.BELOW) return current.compareTo(threshold) <= 0;
        return false;
    }

    private void notifyUser(PriceAlarm alarm, BigDecimal currentPrice) {
        User u = alarm.getUser();
        if (u == null) return;
        if (!u.isEmailNotificationsEnabled()) {
            log.debug("[ALARM_EVAL] {} için kullanıcı e-posta bildirimini kapatmış, atlanıyor.", alarm.getId());
            return;
        }
        if (u.getEmail() == null || u.getEmail().isBlank()) return;

        Map<String, Object> vars = new HashMap<>();
        vars.put("userName", u.getUsername());
        vars.put("symbol", alarm.getSymbol());
        vars.put("assetType", alarm.getAssetType() != null ? alarm.getAssetType().name() : "");
        vars.put("conditionLabel", alarm.getCondition() == AlarmCondition.ABOVE ? "Üzerine Çıktı (≥)" : "Altına İndi (≤)");
        vars.put("threshold", alarm.getThreshold().toPlainString());
        vars.put("currentPrice", currentPrice.toPlainString());
        vars.put("note", alarm.getNote());
        vars.put("lang", "tr");

        emailService.sendTemplated(
                u.getEmail(),
                "[FinansPortal] " + alarm.getSymbol() + " fiyat alarmı tetiklendi",
                "email/alarm-triggered",
                vars,
                Locale.of("tr")
        );
    }
}
