package com.financeportal.domains.currency.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class TcmbIntegrationClient {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${external-api.tcmb.xml-url}")
    private String tcmbXmlUrl;

    private static final List<String> VIP_CURRENCIES = List.of("USD", "EUR", "GBP", "CHF", "CAD", "AUD", "JPY", "DKK", "SEK", "NOK", "SAR", "RUB");

    public List<CurrencyDto> fetchTcmbCurrencyRates() {
        long startTime = System.currentTimeMillis();
        List<CurrencyDto> newRates = new ArrayList<>();
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document document = builder.parse(tcmbXmlUrl);
            document.getDocumentElement().normalize();
            NodeList nList = document.getElementsByTagName("Currency");

            for (int i = 0; i < nList.getLength(); i++) {
                Element element = (Element) nList.item(i);
                String code = element.getAttribute("CurrencyCode");
                if (!VIP_CURRENCIES.contains(code)) continue;

                String forexBuyingStr = element.getElementsByTagName("ForexBuying").item(0).getTextContent();
                String forexSellingStr = element.getElementsByTagName("ForexSelling").item(0).getTextContent();

                if (!forexBuyingStr.isEmpty() && !forexSellingStr.isEmpty()) {
                    CurrencyDto dto = new CurrencyDto();
                    dto.setCurrencyCode(code);
                    dto.setCurrencyName(element.getElementsByTagName("Isim").item(0).getTextContent());
                    dto.setForexBuying(new BigDecimal(forexBuyingStr));
                    dto.setForexSelling(new BigDecimal(forexSellingStr));

                    List<HistoricalDataDto> hist = fetchCurrencyHistoryFromRedis(code, "5y");
                    Map<String, BigDecimal> changes = calculateChangesFromHistory(hist);
                    dto.setChangePercent(changes.getOrDefault("daily", BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
                    dto.setChangeWeek(changes.getOrDefault("weekly", BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
                    dto.setChangeMonth(changes.getOrDefault("monthly", BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
                    dto.setChange6Month(changes.getOrDefault("6monthly", BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
                    dto.setChangeYear(changes.getOrDefault("yearly", BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
                    dto.setChange5Year(changes.getOrDefault("5yearly", BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));

                    dto.setYahooSymbol(code + "TRY=X");
                    dto.setAssetCategory("CURRENCY");
                    dto.setChartType("CANDLE");
                    newRates.add(dto);
                }
            }
            log.info("[TCMB] Fetched {} live currency rates in {} ms.", newRates.size(), (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.error("[TCMB] Failed to fetch currency rates: {}", e.getMessage());
        }
        return newRates;
    }

    /**
     * Döviz tarihçesini Redis'ten okur. Redis'i {@code CurrencySyncService} doldurur
     * (app boot'ta + saatte bir EVDS'den 22 yıl geriye). Bu metod sadece okur — fetch yapmaz.
     * Range param'ı filtreleme için kullanılır ("max" → tüm tarihçe).
     */
    public List<HistoricalDataDto> fetchCurrencyHistoryFromRedis(String currencyCode, String range) {
        String baseCode = currencyCode.replace("TRY=X", "").replace("=X", "").toUpperCase();
        String redisKey = "evds:currency:" + baseCode;

        try {
            String jsonStr = stringRedisTemplate.opsForValue().get(redisKey);
            if (jsonStr == null || jsonStr.isEmpty()) {
                log.debug("[EVDS] {} için Redis'te tarihçe yok (CurrencySyncService henüz çalışmadı olabilir).", baseCode);
                return List.of();
            }
            List<Map<String, Object>> parsedData = objectMapper.readValue(jsonStr, new TypeReference<>() {});
            return mapPointsToHistorical(parsedData, range, baseCode);
        } catch (Exception e) {
            log.error("[EVDS REDIS] {} tarihçe okuma hatası: {}", baseCode, e.getMessage());
            return List.of();
        }
    }

    private List<HistoricalDataDto> mapPointsToHistorical(List<Map<String, Object>> parsedData, String range, String currencyCode) {
        List<HistoricalDataDto> historyList = new ArrayList<>();
        if (parsedData == null || parsedData.isEmpty()) return historyList;
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate cutoffDate = getCutoffDateByRange(range);

            for (Map<String, Object> dataPoint : parsedData) {
                String dateStr = (String) dataPoint.get("date");
                Object rawClose = dataPoint.get("close");
                Double closeVal = (rawClose instanceof Number n) ? n.doubleValue() : null;
                if (dateStr == null || closeVal == null) continue;

                LocalDate date;
                try { date = LocalDate.parse(dateStr, formatter); } catch (Exception ignored) { continue; }
                if (date.isBefore(cutoffDate)) continue;

                HistoricalDataDto dto = new HistoricalDataDto();
                dto.setDate(date);
                dto.setTimestamp(date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli());
                BigDecimal rate = BigDecimal.valueOf(closeVal).setScale(4, RoundingMode.HALF_UP);
                dto.setOpen(rate); dto.setHigh(rate); dto.setLow(rate);
                dto.setClose(rate); dto.setPrice(rate); dto.setVolume(0L);
                historyList.add(dto);
            }
            historyList.sort(Comparator.comparingLong(HistoricalDataDto::getTimestamp));
        } catch (Exception e) {
            log.error("[EVDS] {} historical map hatası: {}", currencyCode, e.getMessage());
        }
        return historyList;
    }

    private Map<String, BigDecimal> calculateChangesFromHistory(List<HistoricalDataDto> hist) {
        Map<String, BigDecimal> changes = new HashMap<>();
        if (hist == null || hist.size() < 2) return changes;
        BigDecimal current = hist.get(hist.size() - 1).getClose();
        changes.put("daily", calcChange(current, getOldPrice(hist, 1)));
        changes.put("weekly", calcChange(current, getOldPrice(hist, 7)));
        changes.put("monthly", calcChange(current, getOldPrice(hist, 30)));
        changes.put("6monthly", calcChange(current, getOldPrice(hist, 180)));
        changes.put("yearly", calcChange(current, getOldPrice(hist, 365)));
        changes.put("5yearly", calcChange(current, getOldPrice(hist, 1825)));
        return changes;
    }

    private BigDecimal getOldPrice(List<HistoricalDataDto> hist, int daysBack) {
        int index = Math.max(hist.size() - 1 - daysBack, 0);
        return hist.get(index).getClose();
    }

    private BigDecimal calcChange(BigDecimal current, BigDecimal old) {
        if (old == null || old.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return current.subtract(old).divide(old, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
    }

    private LocalDate getCutoffDateByRange(String range) {
        LocalDate now = LocalDate.now();
        if ("1w".equalsIgnoreCase(range)) return now.minusDays(7);
        if ("1mo".equalsIgnoreCase(range)) return now.minusDays(30);
        if ("3mo".equalsIgnoreCase(range)) return now.minusDays(90);
        if ("6mo".equalsIgnoreCase(range)) return now.minusDays(180);
        if ("1y".equalsIgnoreCase(range)) return now.minusDays(365);
        if ("5y".equalsIgnoreCase(range)) return now.minusDays(1825);
        if ("10y".equalsIgnoreCase(range)) return now.minusDays(3650);
        if ("all".equalsIgnoreCase(range) || "max".equalsIgnoreCase(range)) return now.minusYears(100);
        return now.minusDays(30);
    }
}
