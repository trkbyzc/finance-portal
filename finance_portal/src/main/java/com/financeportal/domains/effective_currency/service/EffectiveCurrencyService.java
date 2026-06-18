package com.financeportal.domains.effective_currency.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.effective_currency.dto.EffectiveCurrencyDto;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.service.cache.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Efektif döviz okuyucu — sync servisi Redis'i doldurur, bu sınıf okur.
 * {@code CurrencyService} ile birebir aynı kontrat, sadece farklı cache + Redis key prefix'i.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EffectiveCurrencyService {

    private final CacheService cacheService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_KEY = "cache:effective-currencies";
    private static final String REDIS_HIST_PREFIX = "evds:effective-currency:";

    /**
     * Live snapshot. Cache miss durumunda boş liste döner — sync servisi henüz çalışmadıysa.
     * Tipik flow: sync `@EventListener(ApplicationReadyEvent.class)` ile boot'ta cache'i doldurur.
     */
    @SuppressWarnings("unchecked")
    public List<EffectiveCurrencyDto> getEffectiveCurrencies() {
        return cacheService.getOrFetch(CACHE_KEY,
                () -> (List<EffectiveCurrencyDto>) (List<?>) List.of(),  // miss → boş
                60);
    }

    /**
     * Belirli bir efektif döviz kodunun (USD/EUR/GBP vb.) günlük tarihçesi.
     * Redis'e {@link EffectiveCurrencySyncService} tarafından `evds:effective-currency:{CODE}`
     * altında [{date, close}, ...] formatında yazılır.
     */
    public List<Map<String, Object>> getEffectiveCurrencyHistorical(String code, String range) {
        try {
            String key = REDIS_HIST_PREFIX + code.toUpperCase();
            String json = redisTemplate.opsForValue().get(key);
            if (json == null || json.isEmpty()) {
                log.warn("[EFFECTIVE-CURRENCY-HIST] {} için Redis verisi yok ({}).", code, key);
                return new ArrayList<>();
            }
            List<Map<String, Object>> full = objectMapper.readValue(json, new TypeReference<>() {});
            LocalDate cutoff = cutoffByRange(range);
            List<Map<String, Object>> filtered = new ArrayList<>();
            for (Map<String, Object> p : full) {
                String dateStr = (String) p.get("date");
                if (dateStr == null) continue;
                try {
                    LocalDate d = LocalDate.parse(dateStr);
                    if (!d.isBefore(cutoff)) filtered.add(p);
                } catch (Exception ignored) {}
            }
            return filtered;
        } catch (Exception e) {
            log.error("[EFFECTIVE-CURRENCY-HIST] {} okuma hatası: {}", code, e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Chart strategy bunu çağırır — {@link HistoricalDataDto} formatında historical döner.
     * Yapı CurrencyChartStrategy ile uyumlu (line chart, candle alanları aynı close değeriyle doldurulur).
     */
    public List<HistoricalDataDto> getEffectiveCurrencyHistoryAsDto(String code, String range) {
        List<HistoricalDataDto> list = new ArrayList<>();
        try {
            String key = REDIS_HIST_PREFIX + code.toUpperCase();
            String json = redisTemplate.opsForValue().get(key);
            if (json == null || json.isEmpty()) return list;

            List<Map<String, Object>> parsed = objectMapper.readValue(json, new TypeReference<>() {});
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate cutoff = cutoffByRange(range);

            for (Map<String, Object> point : parsed) {
                String dateStr = (String) point.get("date");
                Object rawClose = point.get("close");
                Double closeVal = (rawClose instanceof Number n) ? n.doubleValue() : null;
                if (dateStr == null || closeVal == null) continue;

                LocalDate d;
                try { d = LocalDate.parse(dateStr, formatter); } catch (Exception ignored) { continue; }
                if (d.isBefore(cutoff)) continue;

                HistoricalDataDto dto = new HistoricalDataDto();
                dto.setDate(d);
                dto.setTimestamp(d.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli());
                BigDecimal rate = BigDecimal.valueOf(closeVal).setScale(4, RoundingMode.HALF_UP);
                dto.setOpen(rate); dto.setHigh(rate); dto.setLow(rate);
                dto.setClose(rate); dto.setPrice(rate); dto.setVolume(0L);
                list.add(dto);
            }
            list.sort(Comparator.comparingLong(HistoricalDataDto::getTimestamp));
        } catch (Exception e) {
            log.error("[EFFECTIVE-CURRENCY-CHART] {} hatası: {}", code, e.getMessage());
        }
        return list;
    }

    private LocalDate cutoffByRange(String range) {
        LocalDate now = LocalDate.now();
        if (range == null) return now.minusYears(5);
        return switch (range.toLowerCase()) {
            case "1d" -> now.minusDays(1);   // 1d/5d/1w eskiden default 5 yıla düşüyordu (1G→5 yıl!)
            case "5d" -> now.minusDays(5);
            case "1w" -> now.minusDays(7);
            case "1mo", "1m" -> now.minusMonths(1);
            case "3mo", "3m" -> now.minusMonths(3);
            case "6mo", "6m" -> now.minusMonths(6);
            case "ytd" -> LocalDate.of(now.getYear(), 1, 1);
            case "1y" -> now.minusYears(1);
            case "5y" -> now.minusYears(5);
            case "10y" -> now.minusYears(10);
            case "all", "max" -> now.minusYears(100);
            default -> now.minusYears(5);
        };
    }
}
