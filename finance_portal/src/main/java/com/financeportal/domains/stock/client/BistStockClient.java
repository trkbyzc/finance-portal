package com.financeportal.domains.stock.client;

import com.financeportal.domains.stock.dto.StockDto;
import com.financeportal.domains.stock.service.BistIndexService;
import com.financeportal.model.dto.fintables.FintablesChartResponse;
import com.financeportal.model.dto.market.HistoricalDataDto;
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
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class BistStockClient {

    private final RestTemplate restTemplate;
    private final BistIndexService bistIndexService;
    private final BistLogoClient bistLogoClient;

    private HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        headers.set("Referer", "https://fintables.com/");
        return headers;
    }

    public List<StockDto> fetchTurkishStocks() {
        long startTime = System.currentTimeMillis();
        List<StockDto> stocks = new ArrayList<>();
        Set<String> bist30 = bistIndexService.getBist30();
        Set<String> bist50 = bistIndexService.getBist50();
        Set<String> bist100 = bistIndexService.getBist100();

        try {
            String url = "https://markets.fintables.com/barbar/server/query?fields=C,CP,V&type=equity";
            HttpEntity<String> entity = new HttpEntity<>(getHeaders());
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

            if (response.getBody() != null && response.getBody().get("results") != null) {
                Map<String, List<Map<String, Object>>> results = (Map<String, List<Map<String, Object>>>) response.getBody().get("results");

                for (Map.Entry<String, List<Map<String, Object>>> entry : results.entrySet()) {
                    String symbol = entry.getKey();
                    List<Map<String, Object>> values = entry.getValue();

                    if (values != null && values.size() >= 3) {
                        Object priceObj = values.get(0).get("v");
                        // close null ise (kapalı seans / Fintables veri yok) atla — StockService last-good cache'e düşer.
                        // Tek continue: hem priceObj instanceof Number değilse hem fiyat <= 0 ise.
                        boolean validPrice = priceObj instanceof Number
                                && new BigDecimal(priceObj.toString()).compareTo(BigDecimal.ZERO) > 0;
                        if (!validPrice) continue;
                        BigDecimal price = new BigDecimal(priceObj.toString());

                        StockDto dto = new StockDto();
                        dto.setSymbol(symbol + ".IS");
                        dto.setYahooSymbol(symbol + ".IS");
                        dto.setName(symbol);
                        dto.setImage(bistLogoClient.getLogoUrl(symbol)); // TradingView şirket logosu (yoksa null)
                        dto.setAssetType("HİSSE SENEDİ");
                        dto.setAssetCategory("STOCK");
                        dto.setChartType("CANDLE");

                        // BIST30 ⊂ BIST50 ⊂ BIST100 üst-küme garantisi her endeks tam üyelik döndüğü için.
                        dto.setInBist30(bist30.contains(symbol));
                        dto.setInBist50(bist50.contains(symbol));
                        dto.setInBist100(bist100.contains(symbol));

                        dto.setPrice(price);
                        Object changeObj = values.get(1).get("v");
                        dto.setChangePercent(changeObj instanceof Number ? new BigDecimal(changeObj.toString()) : BigDecimal.ZERO);
                        Object volObj = values.get(2).get("v");
                        dto.setVolume(volObj instanceof Number ? ((Number) volObj).longValue() : 0L);

                        stocks.add(dto);
                    }
                }
                log.info("[BIST_STOCK] Fetched {} Turkish stocks in {} ms.", stocks.size(), (System.currentTimeMillis() - startTime));
            }
        } catch (Exception e) {
            log.error("[BIST_STOCK] Failed to fetch Turkish stocks: {}", e.getMessage());
        }
        return stocks;
    }

    public List<HistoricalDataDto> fetchIndexHistory(String symbol, String range) {
        List<HistoricalDataDto> historyList = new ArrayList<>();
        try {
            long to = Instant.now().getEpochSecond();
            long from; String resolution;
            String safeRange = (range != null) ? range.toLowerCase() : "1mo";

            switch (safeRange) {
                case "1d": from = Instant.now().minus(2, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); resolution = "5"; break;
                case "5d": from = Instant.now().minus(7, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); resolution = "60"; break;
                case "1mo": from = Instant.now().minus(30, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); resolution = "D"; break;
                case "3mo": from = Instant.now().minus(90, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); resolution = "D"; break;
                case "6mo": from = Instant.now().minus(180, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); resolution = "D"; break;
                case "ytd":
                    java.time.LocalDate now = java.time.LocalDate.now();
                    from = java.time.LocalDate.of(now.getYear(), 1, 1).atStartOfDay(java.time.ZoneOffset.UTC).toEpochSecond();
                    resolution = "D";
                    break;
                case "1y": from = Instant.now().minus(365, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); resolution = "D"; break;
                case "5y": from = Instant.now().minus(5L * 365, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); resolution = "D"; break;
                default: from = Instant.now().minus(20L * 365, java.time.temporal.ChronoUnit.DAYS).getEpochSecond(); resolution = "D"; break;
            }

            String url = String.format("https://markets.fintables.com/barbar/udf/history?symbol=%s&resolution=%s&from=%d&to=%d", symbol, resolution, from, to);
            HttpEntity<String> entity = new HttpEntity<>(getHeaders());
            ResponseEntity<FintablesChartResponse> response = restTemplate.exchange(url, HttpMethod.GET, entity, FintablesChartResponse.class);

            if (response.getBody() != null && "ok".equals(response.getBody().getS()) && response.getBody().getT() != null) {
                List<Long> times = response.getBody().getT();
                List<BigDecimal> closes = response.getBody().getC();
                List<BigDecimal> opens = response.getBody().getO();
                List<BigDecimal> highs = response.getBody().getH();
                List<BigDecimal> lows = response.getBody().getL();
                List<Long> volumes = response.getBody().getV();

                for (int i = 0; i < times.size(); i++) {
                    HistoricalDataDto dto = new HistoricalDataDto();
                    dto.setTimestamp(times.get(i) * 1000);
                    dto.setDate(Instant.ofEpochMilli(dto.getTimestamp()).atZone(ZoneId.systemDefault()).toLocalDate());
                    dto.setClose(closes != null && i < closes.size() ? closes.get(i) : BigDecimal.ZERO);
                    dto.setPrice(dto.getClose());
                    dto.setOpen(opens != null && i < opens.size() ? opens.get(i) : dto.getClose());
                    dto.setHigh(highs != null && i < highs.size() ? highs.get(i) : dto.getClose());
                    dto.setLow(lows != null && i < lows.size() ? lows.get(i) : dto.getClose());
                    dto.setVolume(volumes != null && i < volumes.size() && volumes.get(i) != null ? volumes.get(i) : 0L);
                    historyList.add(dto);
                }
            }
        } catch (Exception e) {
            log.error("[BIST_INDEX_CHART] Failed to fetch history for {}: {}", symbol, e.getMessage());
        }
        return historyList;
    }
}