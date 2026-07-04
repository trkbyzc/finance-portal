package com.financeportal.domains.economic_calendar.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.economic_calendar.client.EconomicCalendarClient;
import com.financeportal.domains.economic_calendar.dto.EconomicEventDto;
import com.financeportal.service.bootstrap.BootstrapReadinessTracker;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Ekonomik takvim sync — veri kaynağından (TradingView, {@link EconomicCalendarClient} @Primary)
 * today-7 → today+21 penceresini çekip Redis'e yazar.
 * <p>
 * 6 saatte bir refresh + boot'ta ilk fetch. Cache TTL 6 saat — bir sonraki refresh gelmeden
 * actual değer yayınlanırsa 6 saat içinde görünür.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EconomicCalendarSyncService {

    private final EconomicCalendarClient calendarClient;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final BootstrapReadinessTracker bootstrapTracker;

    private static final String TASK_NAME = "EconomicCalendar";
    private static final String CACHE_KEY = "cache:economic-calendar";

    @Value("${app.ttl.economic-calendar-hours:6}")
    private long economicCalendarTtlHours = 6;

    @PostConstruct
    void registerBootstrap() { bootstrapTracker.register(TASK_NAME); }

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(fixedRateString = "${app.sync.economic-calendar-rate-ms:21600000}")
    public void syncCalendar() {
        try {
            LocalDate today = LocalDate.now();
            LocalDate from = today.minusDays(7);
            LocalDate to = today.plusDays(21);

            List<EconomicEventDto> events = calendarClient.fetchCalendar(from, to);
            if (events == null || events.isEmpty()) {
                log.warn("[ECONOMIC-CALENDAR] Veri kaynağından (TradingView) veri gelmedi — cache dokunulmuyor.");
                return;
            }
            String json = objectMapper.writeValueAsString(events);
            redisTemplate.opsForValue().set(CACHE_KEY, json, economicCalendarTtlHours * 3600, TimeUnit.SECONDS);
            log.info("[ECONOMIC-CALENDAR] {} event Redis'e yazıldı (TTL 6h).", events.size());
        } catch (Exception e) {
            log.error("[ECONOMIC-CALENDAR] sync hatası: {}", e.getMessage(), e);
        } finally {
            bootstrapTracker.markComplete(TASK_NAME);
        }
    }
}
