package com.financeportal.domains.currency.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.client.EvdsClient;
import com.financeportal.domains.currency.client.TcmbIntegrationClient;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.service.cache.CacheService;
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
import java.util.HashMap;
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

    // 🚀 Tüm 12 "VIP" Döviz için TCMB (EVDS) Haritalaması eklendi!
    private final Map<String, String> EVDS_CURRENCIES = Map.ofEntries(
            Map.entry("USD", "TP.DK.USD.A.YTL"),
            Map.entry("EUR", "TP.DK.EUR.A.YTL"),
            Map.entry("GBP", "TP.DK.GBP.A.YTL"),
            Map.entry("CHF", "TP.DK.CHF.A.YTL"),
            Map.entry("CAD", "TP.DK.CAD.A.YTL"),
            Map.entry("AUD", "TP.DK.AUD.A.YTL"),
            Map.entry("JPY", "TP.DK.JPY.A.YTL"),
            Map.entry("DKK", "TP.DK.DKK.A.YTL"),
            Map.entry("SEK", "TP.DK.SEK.A.YTL"),
            Map.entry("NOK", "TP.DK.NOK.A.YTL"),
            Map.entry("SAR", "TP.DK.SAR.A.YTL"),
            Map.entry("RUB", "TP.DK.RUB.A.YTL")
    );

    @EventListener(ApplicationReadyEvent.class) // PROJE AÇILIR AÇILMAZ ÇALIŞTIR!
    @Scheduled(fixedRate = 3600000)
    public void fetchAndCacheCurrencyRates() {
        long startTime = System.currentTimeMillis();

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
    }

    private void syncEvdsCurrencyHistories() {
        log.info("[EVDS-CURRENCY] 5 yıllık (12 VIP Döviz) tarihçeler çekiliyor...");
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(1828);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

        EVDS_CURRENCIES.forEach((currencyCode, evdsCode) -> {
            try {
                String redisKey = "evds:currency:" + currencyCode;
                List<JsonNode> nodes = evdsClient.fetchSeries(List.of(evdsCode), startDate, endDate, null);
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