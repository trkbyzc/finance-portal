package com.financeportal.domains.turkish_bond.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.client.EvdsClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class TurkishBondSyncService {

    private final EvdsClient evdsClient;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @EventListener(ApplicationReadyEvent.class) // Sistem ayağa kalktığında ilk verileri çeker
    @Scheduled(cron = "0 30 16 * * ?") // Her gün 16:30'da
    public void syncTurkishBonds() {
        log.info("[EVDS-TR-BOND] Türk Tahvil verileri çekiliyor...");
        Map<String, String> bondsDict = Map.of(
                "TP.TRD080726K10", "evds:benchmark:1m",
                "TP.TRD070727K10", "evds:benchmark:3m",
                "TP.TRT050728K21", "evds:benchmark:6m",
                "TP.TRT040729K21", "evds:benchmark:1y",
                "TP.TRT020130K18", "evds:benchmark:2y",
                "TP.TRT120331K39", "evds:benchmark:5y",
                "TP.TRT070335K16", "evds:benchmark:10y"
        );

        LocalDate endDate = LocalDate.now();
        // 10 yıl gösterge tahvil tarihçesi — simulation için yeterli derinlik.
        LocalDate startDate = endDate.minusDays(3650);

        List<String> allCodes = new ArrayList<>(bondsDict.keySet());
        // EVDS per-request 1000-nokta limiti var — 10 yıl × 7 seri = ~17,500 nokta tek istekte sığmaz.
        // 3 yıllık chunk'larla paginate et.
        List<JsonNode> nodes = evdsClient.fetchSeriesPaginated(allCodes, startDate, endDate, 3);

        bondsDict.forEach((code, redisKey) -> {
            List<Map<String, Object>> historyList = new ArrayList<>();
            for (JsonNode node : nodes) {
                Double val = evdsClient.extractValueFromNode(node, code);
                String dateStr = node.has("Tarih") ? node.get("Tarih").asText() : null;

                if (val != null && dateStr != null) {
                    try {
                        LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                        String cleanDate = date.toString();
                        historyList.add(Map.of(
                                "date", cleanDate, "time", cleanDate,
                                "close", val, "value", val, "rate", val
                        ));
                    } catch (Exception ignored) {}
                }
            }

            if (!historyList.isEmpty()) {
                try {
                    String json = objectMapper.writeValueAsString(historyList);
                    redisTemplate.opsForValue().set(redisKey, json, 86400, TimeUnit.SECONDS);
                    redisTemplate.opsForValue().set("evds:history:" + code, json, 86400, TimeUnit.SECONDS);
                    log.info("[EVDS-TR-BOND] {} -> {} günlük veri Redis'e basıldı.", code, historyList.size());
                } catch (Exception e) {
                    log.error("[EVDS-TR-BOND] JSON Hatası {}: {}", code, e.getMessage());
                }
            }
        });
    }
}