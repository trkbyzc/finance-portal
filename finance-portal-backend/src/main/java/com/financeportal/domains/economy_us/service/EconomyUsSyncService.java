package com.financeportal.domains.economy_us.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.economy_us.client.FredClient;
import com.financeportal.domains.economy_us.dto.EconomyUsDto;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * ABD enflasyon (CPIAUCSL) verisini FRED'ten çekip Redis'e yazan scheduler.
 * - Startup + her gün 16:50'de (TR economy sync'inden 5dk sonra) çalışır.
 * - Yazdığı key'ler:
 *     evds:history:macro:usdInflationRate  → 10 yıllık CPI raw endeks (TR cumulative ile aynı format)
 *     market:economy:usa                   → Anlık snapshot (cpiIndex, yoyChangePct)
 *   24 saat TTL.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EconomyUsSyncService {

    private static final String HISTORY_KEY = "evds:history:macro:usdInflationRate";
    private static final String SNAPSHOT_KEY = "market:economy:usa";

    private final FredClient fredClient;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final BootstrapReadinessTracker bootstrapTracker;

    @Value("${app.ttl.us-economy-sec:86400}")
    private long usTtlSec = 86400;

    private static final String TASK_NAME = "EconomyUS";

    @PostConstruct
    void registerBootstrap() { bootstrapTracker.register(TASK_NAME); }

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "0 50 16 * * ?")
    public void syncUsInflation() {
        try {
            log.info("[FRED-USD] CPI sync başladı.");
            LocalDate today = LocalDate.now();
            LocalDate tenYearsAgo = today.minusDays(3650);

            List<Map<String, Object>> history = fredClient.fetchObservations("CPIAUCSL", tenYearsAgo, today);
            if (history.isEmpty()) {
                log.warn("[FRED-USD] CPI verisi alınamadı, Redis güncellenmedi.");
                return;
            }

            try {
                redisTemplate.opsForValue().set(HISTORY_KEY, objectMapper.writeValueAsString(history), usTtlSec, TimeUnit.SECONDS);
                log.info("[FRED-USD] {} aylık CPI noktası Redis'e yazıldı.", history.size());

                // Anlık snapshot: son endeks + son 12 ayın YoY % değişimi
                EconomyUsDto snapshot = buildSnapshot(history);
                redisTemplate.opsForValue().set(SNAPSHOT_KEY, objectMapper.writeValueAsString(snapshot), usTtlSec, TimeUnit.SECONDS);
                log.info("[FRED-USD] Anlık snapshot Redis'e yazıldı: cpi={}, yoy={}%",
                        snapshot.getCpiIndex(), snapshot.getYoyChangePct());
            } catch (Exception e) {
                log.error("[FRED-USD] Redis yazma hatası: {}", e.getMessage());
            }
        } finally {
            bootstrapTracker.markComplete(TASK_NAME);
        }
    }

    private EconomyUsDto buildSnapshot(List<Map<String, Object>> history) {
        // Liste FRED'den kronolojik geliyor → en son nokta en güncel CPI
        Map<String, Object> last = history.get(history.size() - 1);
        Double currentCpi = ((Number) last.get("value")).doubleValue();

        // YoY: son nokta vs. 12 ay önceki nokta (varsa)
        Double yoy = null;
        if (history.size() > 12) {
            Map<String, Object> yearAgo = history.get(history.size() - 13);
            double prev = ((Number) yearAgo.get("value")).doubleValue();
            if (prev != 0) {
                yoy = ((currentCpi - prev) / prev) * 100.0;
                yoy = Math.round(yoy * 100.0) / 100.0;
            }
        }

        return new EconomyUsDto(currentCpi, yoy, LocalDateTime.now().toString());
    }
}
