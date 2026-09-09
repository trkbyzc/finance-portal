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
        List<?> raw = cacheService.getOrFetch("cache:currencies", tcmbIntegrationClient::fetchTcmbCurrencyRates, 60);
        // Önbellek-isabetinde elemanlar LinkedHashMap olarak döner (bkz. aşağıdaki not);
        // DTO gibi kullanan çağıranlar aksi halde ClassCastException alır.
        return raw.stream()
                .map(o -> o instanceof CurrencyDto dto ? dto : objectMapper.convertValue(o, CurrencyDto.class))
                .toList();
    }

    /*
     * NEDEN BU ÇEVRİM GEREKİYOR — ve asıl çözümün nerede olduğu:
     *
     * RedisConfig, GenericJackson2JsonRedisSerializer'ı uygulamanın ObjectMapper'ıyla
     * kuruyor. O mapper'da varsayılan tipleme (default typing) kapalı olduğu için değerler
     * `@class` bilgisi olmadan yazılıyor; geri okurken Jackson tipi bilemeyip LinkedHashMap
     * üretiyor. Jenerik silme yüzünden derleyici bunu göremiyor, kod List<CurrencyDto>
     * sanıyor ve ilk getter çağrısında patlıyor.
     *
     * Kalıcı çözüm serileştiriciye tip bilgisi eklemektir; ancak bu, önbellekteki TÜM
     * anahtarların formatını değiştirir ve ayrı olarak test edilmeyi hak eder. O yapılana
     * kadar, önbellekten okunan listeyi DTO gibi kullanan servisler bu çevrimi yapmalı.
     * (PortfolioPriceService.extractPriceFromList aynı sorunu LinkedHashMap dalı ekleyerek
     * tolere ediyor — aynı hatanın başka bir belirtisi.)
     */

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
                } catch (Exception ignored) {
                    // Bozuk tarih formatı (null/boş olmayan ama parse edilemeyen) veriyi sessizce atla; tek hatalı kayıt tüm seriyi kesmemeli.
                }
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
            case "1d" -> now.minusDays(1);   // 1d/5d/1w eskiden default'a (5 yıl) düşüyordu
            case "5d" -> now.minusDays(5);
            case "1w" -> now.minusDays(7);
            case "1mo", "1m", "1a" -> now.minusMonths(1);
            case "3mo", "3m", "3a" -> now.minusMonths(3);
            case "6mo", "6m", "6a" -> now.minusMonths(6);
            case "ytd" -> LocalDate.of(now.getYear(), 1, 1);
            case "1y" -> now.minusYears(1);
            case "5y" -> now.minusYears(5);
            case "10y" -> now.minusYears(10);
            case "all", "max", "tum", "tüm" -> now.minusYears(100);
            default -> now.minusYears(5);
        };
    }
}