package com.financeportal.domains.economy_us.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.economy_us.dto.EconomyUsDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * ABD makro ekonomi verilerini Redis'ten okur.
 * Yazma sorumluluğu EconomyUsSyncService'de — bu sınıf sadece okuma + filtreleme yapar.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EconomyUsService {

    private static final String HISTORY_KEY = "evds:history:macro:usdInflationRate";
    private static final String SNAPSHOT_KEY = "market:economy:usa";

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public EconomyUsDto getMacroEconomyData() {
        try {
            String jsonStr = stringRedisTemplate.opsForValue().get(SNAPSHOT_KEY);
            if (jsonStr != null && !jsonStr.isEmpty()) {
                return objectMapper.readValue(jsonStr, EconomyUsDto.class);
            }
        } catch (Exception e) {
            log.error("[ECONOMY-US] Snapshot load failed: {}", e.getMessage());
        }
        return new EconomyUsDto(null, null, LocalDate.now().toString());
    }

    public List<Map<String, Object>> getEconomyHistory(String range) {
        List<Map<String, Object>> result = new ArrayList<>();
        try {
            String jsonStr = stringRedisTemplate.opsForValue().get(HISTORY_KEY);
            if (jsonStr == null || jsonStr.isEmpty()) return result;

            List<Map<String, Object>> full = objectMapper.readValue(jsonStr, new TypeReference<>() {});
            LocalDate cutoff = getCutoffDateByRange(range);

            for (Map<String, Object> point : full) {
                String dateStr = (String) point.get("date");
                if (dateStr == null) continue;
                try {
                    LocalDate pointDate = LocalDate.parse(dateStr);
                    if (!pointDate.isBefore(cutoff)) result.add(point);
                } catch (Exception ignored) {
                    // Bozuk tarih formatındaki nokta atlanır; geçerli noktalar döndürülmeye devam eder
                }
            }
        } catch (Exception e) {
            log.error("[ECONOMY-US] History read failed: {}", e.getMessage());
        }
        return result;
    }

    private LocalDate getCutoffDateByRange(String range) {
        LocalDate now = LocalDate.now();
        if (range == null) return now.minusYears(10);
        return switch (range.toLowerCase()) {
            // FRED CPI aylık veri — kısa range'lerde min 2-3 ay görünsün diye tampon
            // (Recharts tek nokta ile çizgi çizmiyor)
            case "1mo", "1m", "1a" -> now.minusDays(90);
            case "3mo", "3m", "3a" -> now.minusDays(120);
            case "6mo", "6m", "6a" -> now.minusMonths(6).minusDays(15);
            case "ytd" -> LocalDate.of(now.getYear(), 1, 1);
            case "1y" -> now.minusYears(1);
            case "5y" -> now.minusYears(5);
            case "10y" -> now.minusYears(10);
            case "all" -> now.minusYears(100);
            default -> now.minusYears(10);
        };
    }
}
