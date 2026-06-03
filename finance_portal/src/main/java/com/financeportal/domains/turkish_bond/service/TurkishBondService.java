package com.financeportal.domains.turkish_bond.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.turkish_bond.config.TurkishBondCatalog;
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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TurkishBondService {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final BondMapper bondMapper;
    private final TurkishBondCatalog bondCatalog;

    // Vade kovası → benchmark label (BondMapper'daki gösterge etiketleriyle birebir)
    private static final Map<String, String> BUCKET_LABEL = Map.of(
            "SHORT", "Kısa Vadeli", "Y1", "1+ Yıl", "Y2", "2+ Yıl",
            "Y3", "3+ Yıl", "Y4", "4+ Yıl", "Y5", "5 Yıl+", "Y10", "10 Yıl+");

    public List<Map<String, Object>> getTurkishBonds() {
        List<Map<String, Object>> yieldCurve = bondMapper.getBondYieldCurve();
        return yieldCurve.isEmpty() ? bondMapper.getFallbackYieldCurve() : yieldCurve;
    }

    /**
     * Vade kategorilerine göre küratörlü DİBS listesi (dashboard için).
     * Her tahvilin getirisi, vade kovasının benchmark göstergesinden alınır
     * (bireysel tahvil getirisi açık kaynakta yok; aynı vadedekiler benchmark'ı yakından izler).
     */
    public List<Map<String, Object>> getCategorizedBonds() {
        // Benchmark label → yield haritası
        Map<String, Double> yieldByLabel = new LinkedHashMap<>();
        for (Map<String, Object> b : getTurkishBonds()) {
            Object lbl = b.get("label");
            Object y = b.get("yield");
            if (lbl != null && y instanceof Number n) yieldByLabel.put(lbl.toString(), n.doubleValue());
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (TurkishBondCatalog.CatalogEntry e : bondCatalog.getEntries()) {
            String label = BUCKET_LABEL.getOrDefault(e.getBucket(), "");
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("symbol", e.getSymbol());
            item.put("isin", e.getIsin());
            item.put("name", e.getName());
            item.put("maturity", e.getMaturity());
            item.put("bucket", e.getBucket());
            item.put("label", label);
            Double y = yieldByLabel.get(label);
            if (y != null) item.put("yield", y);
            result.add(item);
        }
        return result;
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
            // Katalog tahvillerinin kendi tarihçesi yok → vade kovasının benchmark eğrisine düş.
            if ((jsonStr == null || jsonStr.isEmpty()) && symbol != null && symbol.startsWith("TP.")) {
                String benchKey = benchmarkKeyForBondSymbol(symbol);
                if (benchKey != null && !benchKey.equals(redisKey)) {
                    jsonStr = stringRedisTemplate.opsForValue().get(benchKey);
                }
            }
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

    /**
     * Katalog tahvili (TP.&lt;ISIN&gt;) için vadeye göre benchmark Redis key'i.
     * ISIN'in DDMMYY vade tarihinden kalan yıl hesaplanır, vade kovasına eşlenir.
     * Bireysel tahvil tarihçesi olmadığından grafik bu temsili eğriyi gösterir.
     */
    private String benchmarkKeyForBondSymbol(String symbol) {
        try {
            String isin = symbol.startsWith("TP.") ? symbol.substring(3) : symbol;
            if (isin.length() < 9) return null;
            int d = Integer.parseInt(isin.substring(3, 5));
            int m = Integer.parseInt(isin.substring(5, 7));
            int y = 2000 + Integer.parseInt(isin.substring(7, 9));
            LocalDate mat = LocalDate.of(y, m, d);
            double years = ChronoUnit.DAYS.between(LocalDate.now(), mat) / 365.25;
            if (years < 0) return null;
            if (years < 1) return "evds:benchmark:1m";   // Kısa Vadeli
            if (years < 2) return "evds:benchmark:3m";   // 1+ Yıl
            if (years < 3) return "evds:benchmark:6m";   // 2+ Yıl
            if (years < 4) return "evds:benchmark:1y";   // 3+ Yıl
            if (years < 5) return "evds:benchmark:2y";   // 4+ Yıl
            if (years < 8) return "evds:benchmark:5y";   // 5 Yıl+ (katalog Y5 kovası ile aynı sınır)
            return "evds:benchmark:10y";                 // 10 Yıl+ (8 yıl ve üzeri uzun vade)
        } catch (Exception e) {
            return null;
        }
    }
}
