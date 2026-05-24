package com.financeportal.domains.currency.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.currency.client.TcmbIntegrationClient;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.service.cache.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CurrencyService {

    private final TcmbIntegrationClient tcmbIntegrationClient;
    private final CacheService cacheService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public List<CurrencyDto> getCurrencyRates() {
        return cacheService.getOrFetch("cache:currencies", tcmbIntegrationClient::fetchTcmbCurrencyRates, 60);
    }

    /**
     * Belirli bir döviz kodunun (USD/EUR/GBP vb.) TRY karşılığı geçmiş günlük serisi.
     * Redis'e CurrencySyncService tarafından `evds:currency:{CODE}` key'i altında [{date, close}, ...]
     * formatında yazılır. close = 1 birim döviz kaç TRY.
     *
     * @param code  USD, EUR, GBP, JPY ... (büyük harf)
     * @param range 1y / 5y / 10y / all  (varsayılan: 5y)
     */
    public List<Map<String, Object>> getCurrencyHistorical(String code, String range) {
        try {
            String redisKey = "evds:currency:" + code.toUpperCase();
            String jsonStr = redisTemplate.opsForValue().get(redisKey);
            if (jsonStr == null || jsonStr.isEmpty()) {
                log.warn("[CURRENCY-HIST] {} için Redis verisi yok ({}).", code, redisKey);
                return new ArrayList<>();
            }

            List<Map<String, Object>> full = objectMapper.readValue(jsonStr, new TypeReference<>() {});
            LocalDate cutoff = getCutoffDateByRange(range);
            List<Map<String, Object>> filtered = new ArrayList<>();
            for (Map<String, Object> point : full) {
                String dateStr = (String) point.get("date");
                if (dateStr == null) continue;
                try {
                    LocalDate d = LocalDate.parse(dateStr);
                    if (!d.isBefore(cutoff)) filtered.add(point);
                } catch (Exception ignored) {}
            }
            return filtered;
        } catch (Exception e) {
            log.error("[CURRENCY-HIST] {} okuma hatası: {}", code, e.getMessage());
            return new ArrayList<>();
        }
    }

    private LocalDate getCutoffDateByRange(String range) {
        LocalDate now = LocalDate.now();
        if (range == null) return now.minusYears(5);
        return switch (range.toLowerCase()) {
            case "1mo", "1m", "1a" -> now.minusMonths(1);
            case "3mo", "3m", "3a" -> now.minusMonths(3);
            case "6mo", "6m", "6a" -> now.minusMonths(6);
            case "ytd" -> LocalDate.of(now.getYear(), 1, 1);
            case "1y" -> now.minusYears(1);
            case "5y" -> now.minusYears(5);
            case "10y" -> now.minusYears(10);
            case "all", "tum", "tüm" -> now.minusYears(100);
            default -> now.minusYears(5);
        };
    }
}