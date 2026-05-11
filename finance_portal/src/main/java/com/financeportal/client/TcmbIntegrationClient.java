package com.financeportal.integration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.model.dto.CurrencyRateDto;
import com.financeportal.model.dto.HistoricalDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private static final String TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";
    private static final List<String> VIP_CURRENCIES = List.of("USD", "EUR", "GBP", "CHF", "CAD", "AUD", "JPY", "DKK", "SEK", "NOK", "SAR", "RUB");

    // =================================================================================
    // CURRENCY EXCHANGE (TCMB LIVE + EVDS HISTORY)
    // =================================================================================

    public List<CurrencyRateDto> fetchTcmbCurrencyRates() {
        long startTime = System.currentTimeMillis();
        List<CurrencyRateDto> newRates = new ArrayList<>();
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document document = builder.parse(TCMB_URL);
            document.getDocumentElement().normalize();
            NodeList nList = document.getElementsByTagName("Currency");

            for (int i = 0; i < nList.getLength(); i++) {
                Element element = (Element) nList.item(i);
                String code = element.getAttribute("CurrencyCode");

                if (!VIP_CURRENCIES.contains(code)) continue;

                String forexBuyingStr = element.getElementsByTagName("ForexBuying").item(0).getTextContent();
                String forexSellingStr = element.getElementsByTagName("ForexSelling").item(0).getTextContent();

                if (!forexBuyingStr.isEmpty() && !forexSellingStr.isEmpty()) {
                    CurrencyRateDto dto = new CurrencyRateDto();
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
            log.error("[TCMB] Failed to fetch or parse currency rates: {}", e.getMessage());
        }
        return newRates;
    }

    public List<HistoricalDataDto> fetchCurrencyHistoryFromRedis(String currencyCode, String range) {
        long startTime = System.currentTimeMillis();
        List<HistoricalDataDto> historyList = new ArrayList<>();
        try {
            String baseCode = currencyCode.replace("TRY=X", "").replace("=X", "").toUpperCase();
            String redisKey = "evds:currency:" + baseCode;

            String jsonStr = stringRedisTemplate.opsForValue().get(redisKey);
            if (jsonStr == null || jsonStr.isEmpty()) {
                log.debug("[EVDS REDIS] No historical data found for currency key: {}", redisKey);
                return historyList;
            }

            List<Map<String, Object>> parsedData = objectMapper.readValue(jsonStr, new TypeReference<>() {});
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate cutoffDate = getCutoffDateByRange(range);

            for (Map<String, Object> dataPoint : parsedData) {
                String dateStr = (String) dataPoint.get("date");
                Double closeVal = (Double) dataPoint.get("close");

                if (dateStr != null && closeVal != null) {
                    LocalDate date = LocalDate.parse(dateStr, formatter);
                    if (!date.isBefore(cutoffDate)) {
                        HistoricalDataDto dto = new HistoricalDataDto();
                        dto.setDate(date);
                        dto.setTimestamp(date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli());

                        BigDecimal rate = BigDecimal.valueOf(closeVal).setScale(4, RoundingMode.HALF_UP);

                        dto.setOpen(rate);
                        dto.setHigh(rate);
                        dto.setLow(rate);
                        dto.setClose(rate);
                        dto.setPrice(rate);
                        dto.setVolume(0L);

                        historyList.add(dto);
                    }
                }
            }
            historyList.sort(Comparator.comparingLong(HistoricalDataDto::getTimestamp));
            log.debug("[EVDS REDIS] Loaded {} historical points for {} in {} ms.", historyList.size(), baseCode, (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.error("[EVDS REDIS] Failed to parse historical data for {}: {}", currencyCode, e.getMessage());
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

    // =================================================================================
    // BONDS & ECONOMY
    // =================================================================================

    public List<Map<String, Object>> generateInvertedYieldCurveBonds() {
        List<Map<String, Object>> bonds = new ArrayList<>();
        String[] displayNames = {"1 yıl", "2 yıl", "5 yıl", "10 yıl"};
        double[] baseYields = {53.25, 49.80, 40.50, 35.85};
        for (int i = 0; i < displayNames.length; i++) {
            bonds.add(Map.of("name", displayNames[i], "yield", baseYields[i] + (Math.random() * 0.5), "type", "Devlet Tahvili (Simule)", "chartType", "LINE", "assetCategory", "BOND"));
        }
        return bonds;
    }

    public List<Map<String, Object>> fetchEconomyDataWithFallback(String metric, String range) {
        List<Map<String, Object>> result = new ArrayList<>();
        result.add(Map.of("label", "2024", "value", 67.03));
        result.add(Map.of("label", "2025", "value", 45.00));
        return result;
    }

    public List<HistoricalDataDto> fetchBondHistoryFromRedis(String symbol, String range) {
        long startTime = System.currentTimeMillis();
        List<HistoricalDataDto> historyList = new ArrayList<>();
        try {
            String redisKey = getBondRedisKey(symbol);
            if (redisKey == null) return historyList;

            String jsonStr = stringRedisTemplate.opsForValue().get(redisKey);
            if (jsonStr == null || jsonStr.isEmpty()) {
                log.debug("[EVDS REDIS] No historical data found for bond key: {}", redisKey);
                return historyList;
            }

            List<Map<String, Object>> parsedData = objectMapper.readValue(jsonStr, new TypeReference<>() {});
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
            LocalDate cutoffDate = getCutoffDateByRange(range);

            for (Map<String, Object> dataPoint : parsedData) {
                String dateStr = (String) dataPoint.get("date");
                Double rateVal = (Double) dataPoint.get("rate");
                if (dateStr != null && rateVal != null) {
                    LocalDate date = LocalDate.parse(dateStr, formatter);
                    if (!date.isBefore(cutoffDate)) {
                        HistoricalDataDto dto = new HistoricalDataDto();
                        dto.setDate(date);
                        dto.setTimestamp(date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli());
                        BigDecimal rate = BigDecimal.valueOf(rateVal).setScale(4, RoundingMode.HALF_UP);
                        dto.setOpen(rate); dto.setHigh(rate); dto.setLow(rate); dto.setClose(rate); dto.setPrice(rate); dto.setVolume(0L);
                        historyList.add(dto);
                    }
                }
            }
            historyList.sort(Comparator.comparingLong(HistoricalDataDto::getTimestamp));
            log.debug("[EVDS REDIS] Loaded {} historical points for bond {} in {} ms.", historyList.size(), symbol, (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.error("[EVDS REDIS] Failed to parse historical data for bond {}: {}", symbol, e.getMessage());
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
            default -> null;
        };
    }

    private LocalDate getCutoffDateByRange(String range) {
        LocalDate now = LocalDate.now();
        if ("1w".equalsIgnoreCase(range)) return now.minusDays(7);
        if ("1mo".equalsIgnoreCase(range)) return now.minusDays(30);
        if ("3mo".equalsIgnoreCase(range)) return now.minusDays(90);
        if ("6mo".equalsIgnoreCase(range)) return now.minusDays(180);
        if ("1y".equalsIgnoreCase(range)) return now.minusDays(365);
        if ("5y".equalsIgnoreCase(range)) return now.minusDays(1825);
        return now.minusDays(30);
    }
}