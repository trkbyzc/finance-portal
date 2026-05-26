package com.financeportal.domains.eurobond.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.client.EvdsClient;
import com.financeportal.domains.eurobond.dto.EurobondAggregateDto;
import com.financeportal.service.bootstrap.BootstrapReadinessTracker;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.TimeUnit;

/**
 * Eurobond aggregate verisini periyodik olarak EVDS'ten Redis'e yazan scheduler.
 *
 * "Türkiye Dış Borçlanma Görünümü" verileri:
 *   - TP.BRUTDBSDDS.G5  : Kısa Vade Borç Senetleri (Eurobond)
 *   - TP.BRUTDBSDDS.G12 : Uzun Vade Borç Senetleri (Eurobond)
 *   - TP.BRUTDBDOVKOMP.G2 : Toplam dış borç USD
 *   - TP.BRUTDBDOVKOMP.G3 : Toplam dış borç EUR
 *   → Redis: eurobond:aggregate:overview
 *
 * Yield verisi (TR 10Y Devlet Tahvili) ayrı yerden gelir:
 *   - TurkishBondSyncService TP.TRT070335K16'yı çekip `evds:benchmark:10y` key'ine yazıyor
 *   - EurobondService doğrudan o key'i okur (bu scheduler'da tekrar çekmiyoruz)
 *
 * Schedule: startup + her gün 16:55 (TurkishBondSyncService 16:30'dan sonra).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EurobondSyncService {

    private static final String AGGREGATE_KEY = "eurobond:aggregate:overview";
    private static final long TTL_SECONDS = 86400;

    private static final String EVDS_SHORT_BOND = "TP.BRUTDBSDDS.G5";
    private static final String EVDS_LONG_BOND = "TP.BRUTDBSDDS.G12";
    private static final String EVDS_TOTAL_USD = "TP.BRUTDBDOVKOMP.G2";
    private static final String EVDS_TOTAL_EUR = "TP.BRUTDBDOVKOMP.G3";

    private final EvdsClient evdsClient;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final BootstrapReadinessTracker bootstrapTracker;

    private static final String TASK_NAME = "Eurobond";

    @PostConstruct
    void registerBootstrap() { bootstrapTracker.register(TASK_NAME); }

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "0 55 16 * * ?")
    public void syncEvdsAggregate() {
        log.info("[EUROBOND] EVDS aggregate sync başlıyor.");
        try {
            LocalDate today = LocalDate.now();
            LocalDate tenYearsAgo = today.minusYears(10);

            List<String> seriesCodes = List.of(EVDS_SHORT_BOND, EVDS_LONG_BOND, EVDS_TOTAL_USD, EVDS_TOTAL_EUR);
            List<JsonNode> observations = evdsClient.fetchSeries(seriesCodes, tenYearsAgo, today, null);
            if (observations.isEmpty()) {
                log.warn("[EUROBOND] EVDS aggregate boş geldi, Redis güncellenmedi.");
                return;
            }

            TreeMap<String, Double> yearlyStock = new TreeMap<>();
            Double lastShortBond = null;
            Double lastLongBond = null;
            Double lastTotalUsd = null;
            Double lastTotalEur = null;

            for (JsonNode point : observations) {
                String dateStr = point.path("Tarih").asText(null);
                if (dateStr == null) continue;
                String year = extractYear(dateStr);
                if (year == null) continue;

                Double shortBond = evdsClient.extractValueFromNode(point, EVDS_SHORT_BOND);
                Double longBond = evdsClient.extractValueFromNode(point, EVDS_LONG_BOND);
                Double totalUsd = evdsClient.extractValueFromNode(point, EVDS_TOTAL_USD);
                Double totalEur = evdsClient.extractValueFromNode(point, EVDS_TOTAL_EUR);

                if (shortBond != null) lastShortBond = shortBond;
                if (longBond != null) lastLongBond = longBond;
                if (totalUsd != null) lastTotalUsd = totalUsd;
                if (totalEur != null) lastTotalEur = totalEur;

                double sum = (shortBond != null ? shortBond : 0) + (longBond != null ? longBond : 0);
                if (sum > 0) {
                    yearlyStock.put(year, sum);
                }
            }

            List<Map<String, Object>> totalStockByYear = new ArrayList<>();
            for (Map.Entry<String, Double> e : yearlyStock.entrySet()) {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("year", e.getKey());
                entry.put("value", Math.round(e.getValue()));
                totalStockByYear.add(entry);
            }

            List<Map<String, Object>> currencyMix = new ArrayList<>();
            if (lastTotalUsd != null && lastTotalEur != null && (lastTotalUsd + lastTotalEur) > 0) {
                double total = lastTotalUsd + lastTotalEur;
                currencyMix.add(currencySlice("USD", (lastTotalUsd / total) * 100.0));
                currencyMix.add(currencySlice("EUR", (lastTotalEur / total) * 100.0));
            }

            List<Map<String, Object>> maturityMix = new ArrayList<>();
            if (lastShortBond != null && lastLongBond != null && (lastShortBond + lastLongBond) > 0) {
                double total = lastShortBond + lastLongBond;
                maturityMix.add(maturitySlice("Kısa Vade", (lastShortBond / total) * 100.0));
                maturityMix.add(maturitySlice("Uzun Vade", (lastLongBond / total) * 100.0));
            }

            EurobondAggregateDto dto = new EurobondAggregateDto(
                    totalStockByYear, currencyMix, maturityMix, LocalDateTime.now().toString()
            );

            redisTemplate.opsForValue().set(
                    AGGREGATE_KEY,
                    objectMapper.writeValueAsString(dto),
                    TTL_SECONDS, TimeUnit.SECONDS
            );
            log.info("[EUROBOND] EVDS aggregate sync OK — {} yıl, currency: {}, vade: {}",
                    totalStockByYear.size(), currencyMix.size(), maturityMix.size());
        } catch (Exception e) {
            log.error("[EUROBOND] EVDS aggregate sync hatası: {}", e.getMessage(), e);
        } finally {
            bootstrapTracker.markComplete(TASK_NAME);
        }
    }

    private Map<String, Object> currencySlice(String currency, double value) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("currency", currency);
        m.put("value", Math.round(value * 100.0) / 100.0);
        return m;
    }

    private Map<String, Object> maturitySlice(String bucket, double value) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("bucket", bucket);
        m.put("value", Math.round(value * 100.0) / 100.0);
        return m;
    }

    private String extractYear(String dateStr) {
        if (dateStr == null) return null;
        String s = dateStr.trim();
        if (s.matches(".*\\d{4}.*")) {
            for (String token : s.split("[^0-9]")) {
                if (token.length() == 4) return token;
            }
        }
        return null;
    }
}
