package com.financeportal.integration;

import com.financeportal.model.dto.HistoricalDataDto;
import com.financeportal.model.dto.MarketAssetDto;
import com.financeportal.model.dto.fintables.FintablesChartResponse;
import com.financeportal.model.dto.fintables.FintablesYieldResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class FintablesIntegrationClient {

    private final RestTemplate restTemplate;

    private HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        headers.set("Referer", "https://fintables.com/");
        headers.set("Origin", "https://fintables.com");
        return headers;
    }

    public List<MarketAssetDto> fetchTefasFunds() {
        long startTime = System.currentTimeMillis();
        try {
            String url = "https://api.fintables.com/funds/yield/?fund_type=mutual&tefas=true";
            HttpEntity<String> entity = new HttpEntity<>(getHeaders());

            ResponseEntity<FintablesYieldResponse> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, FintablesYieldResponse.class);

            if (response.getBody() != null && response.getBody().getResults() != null) {
                List<MarketAssetDto> funds = response.getBody().getResults().stream()
                        .filter(r -> r != null && r.getCode() != null && !r.getCode().isBlank())
                        .map(r -> {
                            MarketAssetDto dto = new MarketAssetDto();
                            dto.setSymbol(r.getCode());
                            dto.setYahooSymbol(r.getCode());
                            dto.setName(r.getTitle());
                            dto.setAssetType("YATIRIM FONU (TEFAS)");
                            dto.setPrice(r.getPrice() != null ? r.getPrice() : BigDecimal.ZERO);
                            dto.setChangePercent(r.getYield_1m() != null ? r.getYield_1m() : BigDecimal.ZERO);
                            dto.setVolume(0L);
                            dto.setAssetCategory("FUND");
                            dto.setChartType("LINE");
                            return dto;
                        }).collect(Collectors.toList());

                log.info("[FINTABLES] Fetched {} TEFAS funds in {} ms.", funds.size(), (System.currentTimeMillis() - startTime));
                return funds;
            }
        } catch (Exception e) {
            log.error("[FINTABLES] Failed to fetch TEFAS funds: {}", e.getMessage());
        }
        return new ArrayList<>();
    }

    public List<HistoricalDataDto> fetchFundHistory(String symbol, String range) {
        long startTime = System.currentTimeMillis();
        List<HistoricalDataDto> historyList = new ArrayList<>();
        try {
            long to = Instant.now().getEpochSecond();
            long from;

            String safeRange = (range != null) ? range.toLowerCase() : "1y";

            switch (safeRange) {
                case "1w": from = Instant.now().minus(7, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
                case "1mo": from = Instant.now().minus(30, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
                case "3mo": from = Instant.now().minus(90, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
                case "6mo": from = Instant.now().minus(180, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
                case "ytd":
                    from = LocalDate.now().withDayOfYear(1).atStartOfDay(ZoneId.systemDefault()).toEpochSecond();
                    break;
                case "3y": from = Instant.now().minus(365 * 3, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
                case "5y": from = Instant.now().minus(365 * 5, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
                case "1y":
                default:
                    from = Instant.now().minus(365, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); break;
            }

            String url = String.format("https://markets.fintables.com/barbar/udf/history?symbol=%s&resolution=D&from=%d&to=%d", symbol, from, to);

            HttpEntity<String> entity = new HttpEntity<>(getHeaders());
            ResponseEntity<FintablesChartResponse> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, FintablesChartResponse.class);

            if (response.getBody() != null && "ok".equals(response.getBody().getS()) && response.getBody().getT() != null) {
                List<Long> times = response.getBody().getT();
                List<BigDecimal> prices = response.getBody().getC();

                for (int i = 0; i < times.size(); i++) {
                    HistoricalDataDto dto = new HistoricalDataDto();
                    dto.setTimestamp(times.get(i) * 1000);
                    dto.setDate(Instant.ofEpochMilli(dto.getTimestamp()).atZone(ZoneId.systemDefault()).toLocalDate());

                    BigDecimal price = prices.get(i);
                    dto.setClose(price);
                    dto.setPrice(price);
                    dto.setOpen(price);
                    dto.setHigh(price);
                    dto.setLow(price);
                    dto.setVolume(0L);

                    historyList.add(dto);
                }
            }
            log.debug("[FINTABLES CHART] Fetched {} historical data points for fund {} in {} ms.", historyList.size(), symbol, (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.error("[FINTABLES CHART] Failed to fetch history for fund {}: {}", symbol, e.getMessage());
        }
        return historyList;
    }

    public List<MarketAssetDto> fetchTurkishStocks() {
        long startTime = System.currentTimeMillis();
        List<MarketAssetDto> stocks = new ArrayList<>();
        try {
            String url = "https://markets.fintables.com/barbar/server/query?fields=C,CP,V&type=equity";
            HttpEntity<String> entity = new HttpEntity<>(getHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            if (response.getBody() != null && response.getBody().get("results") != null) {
                @SuppressWarnings("unchecked")
                Map<String, List<Map<String, Object>>> results =
                        (Map<String, List<Map<String, Object>>>) response.getBody().get("results");

                for (Map.Entry<String, List<Map<String, Object>>> entry : results.entrySet()) {
                    String symbol = entry.getKey();
                    List<Map<String, Object>> values = entry.getValue();

                    if (values != null && values.size() >= 3) {
                        MarketAssetDto dto = new MarketAssetDto();

                        dto.setSymbol(symbol + ".IS");
                        dto.setYahooSymbol(symbol + ".IS");
                        dto.setName(symbol);
                        dto.setAssetType("HİSSE SENEDİ");
                        dto.setAssetCategory("STOCK");
                        dto.setChartType("CANDLE");

                        Object priceObj = values.get(0).get("v");
                        dto.setPrice(priceObj instanceof Number ? new BigDecimal(priceObj.toString()) : BigDecimal.ZERO);

                        Object changeObj = values.get(1).get("v");
                        dto.setChangePercent(changeObj instanceof Number ? new BigDecimal(changeObj.toString()) : BigDecimal.ZERO);

                        Object volObj = values.get(2).get("v");
                        dto.setVolume(volObj instanceof Number ? ((Number) volObj).longValue() : 0L);

                        if (dto.getPrice().compareTo(BigDecimal.ZERO) > 0) {
                            stocks.add(dto);
                        }
                    }
                }
                log.info("[FINTABLES] Fetched {} Turkish stocks in {} ms.", stocks.size(), (System.currentTimeMillis() - startTime));
            }
        } catch (Exception e) {
            log.error("[FINTABLES] Failed to fetch Turkish stocks: {}", e.getMessage());
        }
        return stocks;
    }
}