package com.financeportal.service.market;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.client.EvdsClient;
import com.financeportal.model.dto.account.DepositRatePointDto;
import com.financeportal.model.dto.account.InterestYieldDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterestService {

    private final StringRedisTemplate redisTemplate;
    private final EvdsClient evdsClient;
    private final ObjectMapper objectMapper;

    // 1 yıla kadar TRY mevduat faizi serisi (EVDS). DepositSyncService de aynı kodları kullanır.
    private static final String DEPOSIT_SERIES_CODE = "TP.TRY.MT04";

    public List<InterestYieldDto> calculateDepositYields(BigDecimal amount, int days) {
        String redisKey;
        BigDecimal withholdingTaxRate;

        if (days <= 32) {
            redisKey = "evds:deposit:32";
            withholdingTaxRate = new BigDecimal("0.075");
        } else if (days <= 92) {
            redisKey = "evds:deposit:92";
            withholdingTaxRate = new BigDecimal("0.075");
        } else if (days <= 181) {
            redisKey = "evds:deposit:181";
            withholdingTaxRate = new BigDecimal("0.075");
        } else if (days <= 365) {
            redisKey = "evds:deposit:365";
            withholdingTaxRate = new BigDecimal("0.05");
        } else {
            redisKey = "evds:deposit:365_plus";
            withholdingTaxRate = new BigDecimal("0.025");
        }

        double baseRate = 50.0;

        try {
            String cachedRate = redisTemplate.opsForValue().get(redisKey);
            if (cachedRate != null && !cachedRate.trim().isEmpty()) {
                baseRate = Double.parseDouble(cachedRate);
                log.info("Cache HIT: {} günlük vade için Redis'ten faiz çekildi: %{}", days, baseRate);
            } else {
                log.warn("Redis'te veri yok. {} günlük vade için Fallback %{} kullanılıyor.", days, baseRate);
            }
        } catch (Exception e) {
            log.error("Redis okuma hatası: {}. Fallback %{} kullanılıyor.", e.getMessage(), baseRate);
        }

        Map<String, Double> bankSpreads = new HashMap<>();
        bankSpreads.put("Fibabanka", 4.0);
        bankSpreads.put("Akbank", 3.0);
        bankSpreads.put("ING Bank", 2.0);
        bankSpreads.put("Garanti BBVA", -1.0);
        bankSpreads.put("Enpara.com", -1.5);
        bankSpreads.put("QNB Finansbank", -2.0);
        bankSpreads.put("İş Bankası", -5.0);

        List<InterestYieldDto> results = new ArrayList<>();

        final double finalBaseRate = baseRate;
        bankSpreads.forEach((String bankName, Double spread) -> {
            BigDecimal finalRate = BigDecimal.valueOf(finalBaseRate + spread);
            BigDecimal grossInterest = amount.multiply(finalRate).multiply(BigDecimal.valueOf(days))
                    .divide(BigDecimal.valueOf(36500), 2, RoundingMode.HALF_UP);
            BigDecimal taxDeduction = grossInterest.multiply(withholdingTaxRate)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal netInterest = grossInterest.subtract(taxDeduction);
            BigDecimal totalPayment = amount.add(netInterest);
            results.add(new InterestYieldDto(bankName, finalRate.doubleValue(), netInterest, totalPayment));
        });

        results.sort((a, b) -> Double.compare(b.getAnnualRate(), a.getAnnualRate()));
        return results;
    }

    /**
     * TRY mevduat faizi (1 yıla kadar) tarihsel serisi — Performans karşılaştırma widget'ı için.
     * EVDS'den çekilir, 12 saat Redis'te cache'lenir (EVDS çağrısı yavaş + retry'lı). Dönüş ISO
     * tarih + yıllık % oran çiftleri; frontend dönem boyunca bileşikler.
     */
    public List<DepositRatePointDto> getDepositRateSeries(String range) {
        String cacheKey = "evds:deposit:series:" + (range == null ? "5y" : range.toLowerCase());
        try {
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null && !cached.isBlank()) {
                return objectMapper.readValue(cached, new TypeReference<List<DepositRatePointDto>>() {});
            }
        } catch (Exception e) {
            log.warn("[DEPOSIT-SERIES] cache okuma hatası: {}", e.getMessage());
        }

        List<DepositRatePointDto> series = fetchDepositSeries(range);
        try {
            if (!series.isEmpty()) {
                redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(series), 12, TimeUnit.HOURS);
            }
        } catch (Exception e) {
            log.warn("[DEPOSIT-SERIES] cache yazma hatası: {}", e.getMessage());
        }
        return series;
    }

    private List<DepositRatePointDto> fetchDepositSeries(String range) {
        LocalDate end = LocalDate.now();
        LocalDate start = cutoffForRange(range, end);
        List<JsonNode> nodes = evdsClient.fetchSeriesPaginated(List.of(DEPOSIT_SERIES_CODE), start, end, 3);

        List<DepositRatePointDto> out = new ArrayList<>();
        for (JsonNode node : nodes) {
            String rawDate = node.path("Tarih").asText(null);
            Double rate = evdsClient.extractValueFromNode(node, DEPOSIT_SERIES_CODE);
            if (rawDate == null || rate == null) continue;
            String iso = normalizeEvdsDate(rawDate);
            if (iso != null) out.add(new DepositRatePointDto(iso, rate));
        }
        out.sort(Comparator.comparing(DepositRatePointDto::date));
        log.info("[DEPOSIT-SERIES] {} için {} nokta", range, out.size());
        return out;
    }

    private LocalDate cutoffForRange(String range, LocalDate end) {
        String r = range == null ? "5y" : range.toLowerCase();
        return switch (r) {
            case "1mo", "1a" -> end.minusMonths(1);
            case "3mo", "3a" -> end.minusMonths(3);
            case "6mo", "6a" -> end.minusMonths(6);
            case "ytd" -> LocalDate.of(end.getYear(), 1, 1);
            case "1y" -> end.minusYears(1);
            case "3y" -> end.minusYears(3);
            case "10y" -> end.minusYears(10);
            default -> end.minusYears(5); // 5y / bilinmeyen
        };
    }

    /** EVDS "Tarih" alanını (dd-MM-yyyy ya da yyyy-MM) ISO yyyy-MM-dd'ye çevirir. */
    private String normalizeEvdsDate(String raw) {
        try {
            if (raw.matches("\\d{2}-\\d{2}-\\d{4}")) {
                String[] p = raw.split("-");
                return p[2] + "-" + p[1] + "-" + p[0];
            }
            if (raw.matches("\\d{4}-\\d{2}-\\d{2}")) return raw;
            if (raw.matches("\\d{4}-\\d{2}")) return raw + "-01";
        } catch (Exception ignored) {
        }
        return null;
    }
}
