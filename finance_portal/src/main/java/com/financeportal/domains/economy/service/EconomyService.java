package com.financeportal.domains.economy.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.economy.config.EconomyIndicators;
import com.financeportal.domains.economy.dto.EconomyDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EconomyService {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    /** Ekonomi göstergeleri kayıt defteri — frontend sidebar gruplaması için (key, kategori, birim). */
    public List<Map<String, Object>> getIndicators() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (EconomyIndicators.Indicator ind : EconomyIndicators.ALL) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("key", ind.key());
            m.put("category", ind.category());
            m.put("unit", ind.unit());
            list.add(m);
        }
        return list;
    }

    // Redis'ten anlık makro verileri okur
    public EconomyDto getMacroEconomyData() {
        try {
            String jsonStr = stringRedisTemplate.opsForValue().get("market:economy:turkey");
            if (jsonStr != null && !jsonStr.isEmpty()) {
                return objectMapper.readValue(jsonStr, EconomyDto.class);
            }
        } catch (Exception e) {
            log.error("[ECONOMY] Failed to load macro economy data: {}", e.getMessage());
        }
        return new EconomyDto(50.00, 67.03, 8.70, LocalDate.now().toString());
    }

    // Redis'ten 10 yıllık veriyi okur ve RANGE'e göre filtreler
    public List<Map<String, Object>> getEconomyHistory(String metric, String range) {
        List<Map<String, Object>> result = new ArrayList<>();
        try {
            String redisKey = "evds:history:macro:" + metric;
            String jsonStr = stringRedisTemplate.opsForValue().get(redisKey);

            if (jsonStr != null && !jsonStr.isEmpty()) {
                List<Map<String, Object>> fullHistory = objectMapper.readValue(jsonStr, new TypeReference<>() {});
                LocalDate cutoffDate = getCutoffDateByRange(range);

                // Gelen datayı istenen tarihe göre kes
                for (Map<String, Object> dataPoint : fullHistory) {
                    String dateStr = (String) dataPoint.get("date");
                    if (dateStr != null) {
                        try {
                            LocalDate pointDate = LocalDate.parse(dateStr);
                            // Sadece kesim tarihinden SONRAKİ verileri listeye ekle
                            if (!pointDate.isBefore(cutoffDate)) {
                                result.add(dataPoint);
                            }
                        } catch (Exception ignored) {}
                    }
                }
                return result;
            }
        } catch (Exception e) {
            log.error("[ECONOMY] Macro history error for {}: {}", metric, e.getMessage());
        }
        return result;
    }

    // Range parametresini tarihe çeviren yardımcı metod
    private LocalDate getCutoffDateByRange(String range) {
        LocalDate now = LocalDate.now();
        if (range == null) return now.minusYears(10);

        return switch (range.toLowerCase()) {
            // Aylık veri (TÜFE/CPI) için: kısa range'lerde en az 2-3 ay görünsün diye
            // standart cutoff'tan geniş tutuyoruz — Recharts tek nokta ile çizgi çizmiyor.
            case "1mo", "1m", "1a" -> now.minusDays(90);
            case "3mo", "3m", "3a" -> now.minusDays(120);
            case "6mo", "6m", "6a" -> now.minusMonths(6).minusDays(15);
            case "ytd" -> LocalDate.of(now.getYear(), 1, 1);
            case "1y" -> now.minusYears(1);
            case "5y", "5a" -> now.minusYears(5);
            case "10y", "10a" -> now.minusYears(10);
            case "all", "tümü" -> now.minusYears(100);
            default -> now.minusYears(10);
        };
    }
}