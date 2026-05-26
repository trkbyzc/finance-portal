package com.financeportal.domains.economy.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class EconomySyncService {

    private final EvdsClient evdsClient;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final BootstrapReadinessTracker bootstrapTracker;

    private static final String TASK_NAME = "Economy";

    @PostConstruct
    void registerBootstrap() { bootstrapTracker.register(TASK_NAME); }

    @EventListener(ApplicationReadyEvent.class) // Sistem ayağa kalktığında ilk verileri çeker
    @Scheduled(cron = "0 45 16 * * ?") // 16:45'te çalışsın
    public void syncMacroEconomy() {
        try {
        log.info("[EVDS-ECONOMY] Makro ekonomi verileri çekiliyor...");
        LocalDate today = LocalDate.now();

        // 1. CANLI KART VERİLERİ (Son 180 güne bakıp en güncelini al)
        Map<String, Object> macroData = new HashMap<>();

        Double interest = extractLatest(evdsClient.fetchSeries(List.of("TP.APIFON4"), today.minusDays(180), today, null), "TP.APIFON4");
        Double unemployment = extractLatest(evdsClient.fetchSeries(List.of("TP.TIG08"), today.minusDays(180), today, null), "TP.TIG08");
        Double inflation = extractLatest(evdsClient.fetchSeries(List.of("TP.GENENDEKS.T1"), today.minusDays(180), today, "3"), "TP.GENENDEKS.T1");

        macroData.put("interestRate", interest != null ? interest : 50.00);
        macroData.put("unemploymentRate", unemployment != null ? unemployment : 8.70);
        macroData.put("inflationRate", inflation != null ? inflation : 67.03);
        macroData.put("lastUpdated", LocalDateTime.now().toString());

        try {
            redisTemplate.opsForValue().set("market:economy:turkey", objectMapper.writeValueAsString(macroData), 86400, TimeUnit.SECONDS);
            log.info("[EVDS-ECONOMY] Anlık ekonomi verileri Redis'e yazıldı.");
        } catch (Exception e) { log.error("Macro JSON Error", e); }

        // 2. 10 YILLIK GRAFİK GEÇMİŞİ
        LocalDate tenYearsAgo = today.minusDays(3650);
        saveHistory("TP.APIFON4", "interestRate", tenYearsAgo, today, null);
        saveHistory("TP.TIG08", "unemploymentRate", tenYearsAgo, today, null);
        saveHistory("TP.GENENDEKS.T1", "inflationRate", tenYearsAgo, today, "3");
        // Cumulative CPI endeks (formula=null/0): varlık-enflasyon overlay'i için baz değer
        // Frontend basePrice normalization yapıyor, raw endeks gerekiyor (örn. 100 -> 145 = +%45 toplam)
        saveHistory("TP.GENENDEKS.T1", "cumulativeInflationRate", tenYearsAgo, today, null);
        } finally {
            bootstrapTracker.markComplete(TASK_NAME);
        }
    }

    private Double extractLatest(List<JsonNode> nodes, String code) {
        Double latest = null;
        for (JsonNode node : nodes) {
            Double val = evdsClient.extractValueFromNode(node, code);
            if (val != null) latest = val;
        }
        return latest;
    }

    private void saveHistory(String code, String metricName, LocalDate start, LocalDate end, String formula) {
        List<JsonNode> nodes = evdsClient.fetchSeries(List.of(code), start, end, formula);
        List<Map<String, Object>> historyList = new ArrayList<>();

        for (JsonNode node : nodes) {
            Double val = evdsClient.extractValueFromNode(node, code);
            String dateStr = node.has("Tarih") ? node.get("Tarih").asText() : null;

            if (val != null && dateStr != null && !dateStr.equals("ND")) {
                LocalDate parsedDate = parseEvdsDate(dateStr);
                if (parsedDate != null) {
                    historyList.add(Map.of(
                            "date", parsedDate.toString(),
                            "label", parsedDate.format(DateTimeFormatter.ofPattern("yyyy-MM")),
                            "value", val
                    ));
                }
            }
        }

        if (!historyList.isEmpty()) {
            try {
                redisTemplate.opsForValue().set("evds:history:macro:" + metricName, objectMapper.writeValueAsString(historyList), 86400, TimeUnit.SECONDS);
                log.info("[EVDS-ECONOMY] {} -> {} aylık veri Redis'e basıldı.", metricName, historyList.size());
            } catch (Exception e) { log.error("Macro History Error", e); }
        }
    }

    /**
     * EVDS tarih alanını parse eder. EVDS aylık veriyi "yyyy-M" (örn. "2025-1")
     * veya "yyyy-MM" (örn. "2025-10") olarak; günlük veriyi "dd-MM-yyyy" olarak döner.
     * Eski kod sadece length==7 (yyyy-MM) kabul ettiği için tek haneli aylar
     * (Ocak-Eylül) atılıyordu — bu yüzden yılda sadece 3 ay (Eki-Kas-Ara) Redis'e geliyordu.
     */
    private LocalDate parseEvdsDate(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        if (s.isEmpty() || s.equalsIgnoreCase("ND")) return null;
        try {
            if (s.matches("\\d{4}-\\d{1,2}")) {
                String[] parts = s.split("-");
                return LocalDate.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), 1);
            }
            if (s.matches("\\d{1,2}-\\d{1,2}-\\d{4}")) {
                return LocalDate.parse(s, DateTimeFormatter.ofPattern("d-M-yyyy"));
            }
        } catch (Exception ignored) {}
        return null;
    }
}