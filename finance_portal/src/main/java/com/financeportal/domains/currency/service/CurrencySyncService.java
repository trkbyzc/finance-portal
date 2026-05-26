package com.financeportal.domains.currency.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.client.EvdsClient;
import com.financeportal.domains.currency.client.TcmbIntegrationClient;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.service.bootstrap.BootstrapReadinessTracker;
import com.financeportal.service.cache.CacheService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class CurrencySyncService {

    private final TcmbIntegrationClient tcmbIntegrationClient;
    private final EvdsClient evdsClient;
    private final CacheService cacheService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final BootstrapReadinessTracker bootstrapTracker;

    private static final String TASK_NAME = "Currency";

    @PostConstruct
    void registerBootstrap() { bootstrapTracker.register(TASK_NAME); }

    // EVDS döviz serileri. ".S.YTL" (Satış) tercih edilir — UI'daki anlık fiyat header'ı
    // forexSelling kullanıyor; CurrencyChartStrategy zaten son nokta'yı bunla patch'liyor.
    // .A.YTL (Alış) serileri TCMB'de görece yeni; .S.YTL daha eski tarihlere kadar gider.
    private final Map<String, String> EVDS_CURRENCIES = Map.ofEntries(
            Map.entry("USD", "TP.DK.USD.S.YTL"),
            Map.entry("EUR", "TP.DK.EUR.S.YTL"),
            Map.entry("GBP", "TP.DK.GBP.S.YTL"),
            Map.entry("CHF", "TP.DK.CHF.S.YTL"),
            Map.entry("CAD", "TP.DK.CAD.S.YTL"),
            Map.entry("AUD", "TP.DK.AUD.S.YTL"),
            Map.entry("JPY", "TP.DK.JPY.S.YTL"),
            Map.entry("DKK", "TP.DK.DKK.S.YTL"),
            Map.entry("SEK", "TP.DK.SEK.S.YTL"),
            Map.entry("NOK", "TP.DK.NOK.S.YTL"),
            Map.entry("SAR", "TP.DK.SAR.S.YTL"),
            Map.entry("RUB", "TP.DK.RUB.S.YTL")
    );

    @EventListener(ApplicationReadyEvent.class) // PROJE AÇILIR AÇILMAZ ÇALIŞTIR!
    @Scheduled(fixedRate = 3600000)
    public void fetchAndCacheCurrencyRates() {
        long startTime = System.currentTimeMillis();
        try {
            // 1. Önce EVDS'den tarihçeleri (5 yıllık) çekip Redis'e basalım
            syncEvdsCurrencyHistories();

            // 2. Ardından bugünün canlı verisini çekelim (Redis hesaplayacak)
            List<CurrencyDto> rates = tcmbIntegrationClient.fetchTcmbCurrencyRates();
            if (rates != null && !rates.isEmpty()) {
                cacheService.save("cache:currencies", rates, 60);
                log.info("[CURRENCY_SYNC] Successfully updated {} currency rates in {} ms.", rates.size(), (System.currentTimeMillis() - startTime));
            } else {
                log.warn("[CURRENCY_SYNC] Failed to update currency rates.");
            }
        } finally {
            bootstrapTracker.markComplete(TASK_NAME);
        }
    }

    private void syncEvdsCurrencyHistories() {
        log.info("[EVDS-CURRENCY] 22 yıllık (12 VIP Döviz) tarihçeler çekiliyor...");
        LocalDate endDate = LocalDate.now();
        // 22 yıl ≈ 8030 gün. TCMB döviz serileri 2003'e kadar dayanıyor — tüm tarihçeyi kapsar.
        LocalDate startDate = endDate.minusDays(8030);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

        EVDS_CURRENCIES.forEach((currencyCode, evdsCode) -> {
            try {
                String redisKey = "evds:currency:" + currencyCode;
                // Cache-hit guard: Redis TTL 24h, hourly schedule'da her saat EVDS'i 84 kez (12 döviz × 7 chunk)
                // bombardıman etmek anlamsız. Sadece TTL expire olduğunda re-sync.
                if (Boolean.TRUE.equals(redisTemplate.hasKey(redisKey))) {
                    log.debug("[EVDS-CURRENCY] {} cache hit, sync skip.", currencyCode);
                    return;
                }
                // EVDS per-request 1000-nokta limiti var — 22 yıllık günlük seriyi tek istekte alamayız.
                // 3 yıllık chunk'larla paginate et (3y × 252 trade days ≈ 756 nokta < 1000 limit).
                List<JsonNode> nodes = evdsClient.fetchSeriesPaginated(List.of(evdsCode), startDate, endDate, 3);
                List<Map<String, Object>> historyList = new ArrayList<>();

                for (JsonNode node : nodes) {
                    Double val = evdsClient.extractValueFromNode(node, evdsCode);
                    String dateStr = node.has("Tarih") ? node.get("Tarih").asText() : null;

                    if (val != null && dateStr != null) {
                        try {
                            LocalDate date = LocalDate.parse(dateStr, formatter);
                            historyList.add(Map.of("date", date.toString(), "close", val));
                        } catch (Exception ignored) {}
                    }
                }

                if (!historyList.isEmpty()) {
                    redisTemplate.opsForValue().set(redisKey, objectMapper.writeValueAsString(historyList), 86400, TimeUnit.SECONDS);
                    log.info("[EVDS-CURRENCY] {} geçmişi tamam ({} adet).", currencyCode, historyList.size());
                }

            } catch (Exception e) {
                log.error("[EVDS-CURRENCY] {} tarihçesi hatası: {}", currencyCode, e.getMessage());
            }
        });
    }
}