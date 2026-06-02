package com.financeportal.domains.economy.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.client.EvdsClient;
import com.financeportal.domains.economy.config.EconomyIndicators;
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

        // TP.APIFON4: BIST Repo-Reverse Repo Pazarı Ortalama Faiz Oranı.
        // History TCMB tarafından ~2022-08'de yeniden yapılandırıldı, ondan eskisi yok.
        // Daha uzun politika faizi tarihçesi için doğru EVDS kodu tespit edilmeli.
        Double interest = extractLatest(evdsClient.fetchSeries(List.of("TP.APIFON4"), today.minusDays(180), today, null), "TP.APIFON4");
        Double unemployment = extractLatest(evdsClient.fetchSeries(List.of("TP.YISGUCU2.G8"), today.minusDays(365), today, null), "TP.YISGUCU2.G8");
        Double inflation = extractLatest(evdsClient.fetchSeries(List.of("TP.TUKFIY2025.GENEL"), today.minusDays(365), today, "3"), "TP.TUKFIY2025.GENEL");

        macroData.put("interestRate", interest != null ? interest : 50.00);
        macroData.put("unemploymentRate", unemployment != null ? unemployment : 8.70);
        macroData.put("inflationRate", inflation != null ? inflation : 67.03);
        macroData.put("lastUpdated", LocalDateTime.now().toString());

        try {
            redisTemplate.opsForValue().set("market:economy:turkey", objectMapper.writeValueAsString(macroData), 86400, TimeUnit.SECONDS);
            log.info("[EVDS-ECONOMY] Anlık ekonomi verileri Redis'e yazıldı.");
        } catch (Exception e) { log.error("Macro JSON Error", e); }

        // 2. 10 YILLIK GRAFİK GEÇMİŞİ — gösterge kayıt defterindeki tüm EVDS serileri
        LocalDate tenYearsAgo = today.minusDays(3650);
        for (EconomyIndicators.Indicator ind : EconomyIndicators.ALL) {
            saveHistory(ind.code(), ind.key(), tenYearsAgo, today, ind.formula());
        }
        // Cumulative CPI endeks (formula=null/0): varlık-enflasyon overlay'i için baz değer (ayrı key)
        saveHistory("TP.TUKFIY2025.GENEL", "cumulativeInflationRate", tenYearsAgo, today, null);
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
        // Formula (yıllık %değişim) gerektirenlerde tekli fetch (aylık seri, <1000 nokta);
        // seviye serilerinde paginated (günlük 10y > 1000 nokta sınırını aşar) → tam geçmiş.
        List<JsonNode> nodes = (formula != null)
                ? evdsClient.fetchSeries(List.of(code), start, end, formula)
                : evdsClient.fetchSeriesPaginated(List.of(code), start, end, 3);
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
                log.info("[EVDS-ECONOMY] {} ({}): {} kayıt Redis'e basıldı (ilk: {}, son: {}).",
                        metricName, code, historyList.size(),
                        historyList.get(0).get("date"), historyList.get(historyList.size() - 1).get("date"));
            } catch (Exception e) { log.error("Macro History Error", e); }
        } else {
            log.warn("[EVDS-ECONOMY] {} ({}): EVDS boş döndü — seri kodu yanlış veya tarih aralığında veri yok. " +
                     "Eski cache'i KORUYORUZ (overwrite etmiyoruz).", metricName, code);
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