package com.financeportal.client.yahoo;

import com.fasterxml.jackson.databind.JsonNode;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.util.HttpHeadersUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
@Slf4j
public class YahooChartClient {

    private final RestTemplate restTemplate;

    @Value("${external-api.yahoo.base-url}")
    private String yahooBaseUrl;

    public List<HistoricalDataDto> fetchChartHistory(String yahooSymbol, String range, String interval, String startDate, String endDate) {
        long startTime = System.currentTimeMillis();
        List<HistoricalDataDto> dataList = new ArrayList<>();

        try {
            HttpEntity<String> entity = new HttpEntity<>(HttpHeadersUtil.getYahooFinanceHeaders());
            String mappedRange = mapRange(range);
            String activeInterval = "1d".equals(mappedRange) ? "15m" : interval;
            String url;

            if ("custom".equals(mappedRange) && startDate != null && !startDate.isEmpty()) {
                long p1 = LocalDate.parse(startDate).atStartOfDay(ZoneId.systemDefault()).toEpochSecond();
                long p2 = LocalDate.parse(endDate).plusDays(1).atStartOfDay(ZoneId.systemDefault()).toEpochSecond();
                url = yahooBaseUrl + String.format("%s?period1=%d&period2=%d&interval=%s", yahooSymbol, p1, p2, activeInterval);
            } else {
                url = yahooBaseUrl + String.format("%s?range=%s&interval=%s", yahooSymbol, mappedRange, activeInterval);
            }

            ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
            if (response.getBody() == null) return dataList;

            JsonNode resultNode = response.getBody().path("chart").path("result");
            if (resultNode.isMissingNode() || resultNode.isEmpty()) return dataList;

            JsonNode result = resultNode.get(0);
            JsonNode timestamps = result.path("timestamp");
            JsonNode quote = result.path("indicators").path("quote").get(0);

            if (timestamps.isArray()) {
                for (int i = 0; i < timestamps.size(); i++) {
                    JsonNode cNode = quote.path("close").get(i);
                    if (cNode == null || cNode.isNull()) continue;

                    HistoricalDataDto dto = new HistoricalDataDto();
                    long ts = timestamps.get(i).asLong();
                    dto.setTimestamp(ts * 1000);
                    dto.setDate(Instant.ofEpochSecond(ts).atZone(ZoneId.systemDefault()).toLocalDate());

                    double close = cNode.asDouble();
                    // Scale 8: PEPE/SHIB/BONK gibi düşük fiyatlı coinler için (0.00000394) — 4 ondalık sıfıra yuvarlıyordu
                    dto.setOpen(BigDecimal.valueOf(quote.path("open").get(i).asDouble(close)).setScale(8, RoundingMode.HALF_UP));
                    dto.setHigh(BigDecimal.valueOf(quote.path("high").get(i).asDouble(close)).setScale(8, RoundingMode.HALF_UP));
                    dto.setLow(BigDecimal.valueOf(quote.path("low").get(i).asDouble(close)).setScale(8, RoundingMode.HALF_UP));
                    dto.setClose(BigDecimal.valueOf(close).setScale(8, RoundingMode.HALF_UP));
                    dto.setPrice(dto.getClose());
                    dto.setVolume(quote.path("volume").get(i).asLong(0L));

                    dataList.add(dto);
                }
            }
            log.debug("[YAHOO-CHART] Fetched {} points for {} in {} ms.", dataList.size(), yahooSymbol, (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.error("[YAHOO-CHART] Error for {}: {}", yahooSymbol, e.getMessage());
        }
        return dataList;
    }

    private String mapRange(String range) {
        if (range == null) return "1mo";

        return switch (range.toLowerCase(Locale.ENGLISH)) {
            case "1g", "1d" -> "1d";
            case "1h", "1w", "5d" -> "5d"; // 1 Hafta için 5 işlem günü
            case "1a", "1m", "1mo" -> "1mo";
            case "3a", "3m", "3mo" -> "3mo";
            case "6a", "6m", "6mo" -> "6mo";
            case "1y" -> "1y";
            case "5y" -> "5y";
            case "ytd" -> "ytd";
            default -> range.toLowerCase(Locale.ENGLISH);
        };
    }
}