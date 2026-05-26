package com.financeportal.domains.turkish_bond.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.service.mapper.BondMapper;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class TurkishBondService {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final BondMapper bondMapper;

    public List<Map<String, Object>> getTurkishBonds() {
        List<Map<String, Object>> yieldCurve = bondMapper.getBondYieldCurve();
        return yieldCurve.isEmpty() ? bondMapper.getFallbackYieldCurve() : yieldCurve;
    }

    /**
     * TR tahvil tarihçesini Redis'ten okur. Redis'i {@code TurkishBondSyncService} doldurur
     * (app boot + günlük cron'da EVDS'den 10 yıl). Bu metod sadece okur — fetch yapmaz.
     */
    public List<HistoricalDataDto> fetchBondHistoryFromRedis(String symbol) {
        String redisKey = getBondRedisKey(symbol);
        if (redisKey == null) return List.of();

        try {
            String jsonStr = stringRedisTemplate.opsForValue().get(redisKey);
            if (jsonStr == null || jsonStr.isEmpty()) {
                log.debug("[TR-BOND] {} için Redis'te tarihçe yok (TurkishBondSyncService henüz çalışmadı olabilir).", symbol);
                return List.of();
            }
            List<Map<String, Object>> parsedData = objectMapper.readValue(jsonStr, new TypeReference<>() {});
            return mapToHistorical(parsedData, symbol);
        } catch (Exception e) {
            log.error("[TR-BOND] {} Redis read error: {}", symbol, e.getMessage());
            return List.of();
        }
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
