package com.financeportal.domains.deposit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.financeportal.client.EvdsClient;
import com.financeportal.service.bootstrap.BootstrapReadinessTracker;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepositSyncService {

    private final EvdsClient evdsClient;
    private final StringRedisTemplate redisTemplate;
    private final BootstrapReadinessTracker bootstrapTracker;

    private static final String TASK_NAME = "Deposit";

    @PostConstruct
    void registerBootstrap() { bootstrapTracker.register(TASK_NAME); }

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "0 0 17 * * ?") // 17:00'da çalışsın
    public void syncDeposits() {
        try {
        log.info("[EVDS-DEPOSIT] Mevduat faizleri çekiliyor...");
        Map<String, String> depositsDict = Map.of(
                "TP.TRY.MT01", "evds:deposit:32",
                "TP.TRY.MT02", "evds:deposit:92",
                "TP.TRY.MT03", "evds:deposit:181",
                "TP.TRY.MT04", "evds:deposit:365",
                "TP.TRY.MT05", "evds:deposit:365_plus"
        );

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(60);

        List<String> allCodes = new ArrayList<>(depositsDict.keySet());
        List<JsonNode> nodes = evdsClient.fetchSeries(allCodes, startDate, endDate, null);

        depositsDict.forEach((code, redisKey) -> {
            Double latestValue = null;
            // Listeyi gezip en son geçerli olan veriyi bul
            for (JsonNode node : nodes) {
                Double val = evdsClient.extractValueFromNode(node, code);
                if (val != null) latestValue = val;
            }

            if (latestValue != null) {
                // Python'daki gibi sadece rakamı string olarak basıyoruz, JSON array değil!
                redisTemplate.opsForValue().set(redisKey, String.valueOf(latestValue), 86400, TimeUnit.SECONDS);
                log.info("[EVDS-DEPOSIT] {} -> %{} Redis'e yazıldı.", code, latestValue);
            }
        });
        } finally {
            bootstrapTracker.markComplete(TASK_NAME);
        }
    }
}