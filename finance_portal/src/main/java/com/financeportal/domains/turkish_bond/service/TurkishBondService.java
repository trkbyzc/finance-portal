package com.financeportal.domains.turkish_bond.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.client.evds.EvdsHistoryClient;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.service.mapper.BondMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TurkishBondService {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final BondMapper bondMapper;
    private final EvdsHistoryClient evdsHistoryClient;

    /** EVDS'den bond verisi ne kadar geriye gidiyor — gösterge tahviller 10 yıl yeter. */
    private static final int BOND_YEARS_BACK = 10;
    private static final long REDIS_TTL_HOURS = 24;

    public List<Map<String, Object>> getTurkishBonds() {
        List<Map<String, Object>> yieldCurve = bondMapper.getBondYieldCurve();
        return yieldCurve.isEmpty() ? bondMapper.getFallbackYieldCurve() : yieldCurve;
    }

    public List<HistoricalDataDto> fetchBondHistoryFromRedis(String symbol) {
        List<Map<String, Object>> raw = ensureBondHistoryInRedis(symbol);
        return mapToHistorical(raw, symbol);
    }

    /**
     * Redis cache kontrol → varsa onu döner. Yoksa EVDS'den çekip Redis'e yazar.
     * Önceki mimaride data_pipeline/evds_worker.py'ın yaptığı işin Java karşılığı.
     */
    private List<Map<String, Object>> ensureBondHistoryInRedis(String symbol) {
        String redisKey = getBondRedisKey(symbol);
        if (redisKey == null) return List.of();

        try {
            String cached = stringRedisTemplate.opsForValue().get(redisKey);
            if (cached != null && !cached.isEmpty()) {
                return objectMapper.readValue(cached, new TypeReference<>() {});
            }
        } catch (Exception e) {
            log.warn("[TR-BOND] Redis okuma hatası {}: {}", redisKey, e.getMessage());
        }

        // Cache miss → EVDS'den çek (symbol zaten EVDS seri kodu — TP.TRT* ile başlıyor).
        List<Map<String, Object>> fresh = evdsHistoryClient.fetchSeriesYears(symbol, BOND_YEARS_BACK);
        if (fresh.isEmpty()) return List.of();

        try {
            stringRedisTemplate.opsForValue().set(
                    redisKey,
                    objectMapper.writeValueAsString(fresh),
                    Duration.ofHours(REDIS_TTL_HOURS)
            );
            log.info("[TR-BOND] {} → {} nokta Redis'e yazıldı (key={}, TTL={}h)",
                    symbol, fresh.size(), redisKey, REDIS_TTL_HOURS);
        } catch (Exception e) {
            log.warn("[TR-BOND] Redis yazma hatası {}: {}", redisKey, e.getMessage());
        }
        return fresh;
    }

    private List<HistoricalDataDto> mapToHistorical(List<Map<String, Object>> parsedData, String symbol) {
        List<HistoricalDataDto> historyList = new ArrayList<>();
        if (parsedData == null || parsedData.isEmpty()) return historyList;
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            for (Map<String, Object> dataPoint : parsedData) {
                String dateStr = (String) dataPoint.get("date");
                Object rawRate = dataPoint.get("rate");
                if (rawRate == null) rawRate = dataPoint.get("close");
                Double rateVal = (rawRate instanceof Number n) ? n.doubleValue() : null;
                if (dateStr == null || rateVal == null) continue;
                LocalDate date;
                try { date = LocalDate.parse(dateStr, formatter); } catch (Exception ignored) { continue; }

                HistoricalDataDto dto = new HistoricalDataDto();
                dto.setDate(date);
                dto.setTimestamp(date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli());
                BigDecimal rate = BigDecimal.valueOf(rateVal).setScale(4, RoundingMode.HALF_UP);
                dto.setOpen(rate); dto.setHigh(rate); dto.setLow(rate);
                dto.setClose(rate); dto.setPrice(rate); dto.setVolume(0L);
                historyList.add(dto);
            }
            historyList.sort(Comparator.comparingLong(HistoricalDataDto::getTimestamp));
        } catch (Exception e) {
            log.error("[TR-BOND] {} historical map hatası: {}", symbol, e.getMessage());
        }
        return historyList;
    }

    private String getBondRedisKey(String symbol) {
        return switch (symbol) {
            case "TP.TRT080726K46.ORAN" -> "evds:benchmark:1m";
            case "TP.TRT190826K75.ORAN" -> "evds:benchmark:3m";
            case "TP.TRT141026K50.ORAN" -> "evds:benchmark:6m";
            case "TP.TRT140427K40.ORAN" -> "evds:benchmark:1y";
            case "TP.TRT160228K56.ORAN" -> "evds:benchmark:2y";
            case "TP.TRT120231K22.ORAN" -> "evds:benchmark:5y";
            case "TP.TRT050935A14.ORAN" -> "evds:benchmark:10y";
            default -> symbol.startsWith("TP.") ? "evds:history:" + symbol : null;
        };
    }
}