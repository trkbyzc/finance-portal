package com.financeportal.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.financeportal.model.dto.HistoricalDataDto;
import com.financeportal.model.dto.MarketAssetDto;
import com.financeportal.util.HttpHeadersUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Slf4j
public class YahooFinanceClient {

    private final RestTemplate restTemplate;

    public List<MarketAssetDto> fetchFromYahooAPI(String[] symbols, String assetType) {
        long startTime = System.currentTimeMillis();
        HttpEntity<String> entity = new HttpEntity<>(HttpHeadersUtil.getYahooFinanceHeaders());
        List<MarketAssetDto> list = new ArrayList<>();
        int successCount = 0;

        for (String sym : symbols) {
            try {
                String url = "https://query1.finance.yahoo.com/v8/finance/chart/" + sym + "?range=1d&interval=1d";
                ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);

                if (response.getBody() != null) {
                    JsonNode meta = response.getBody().path("chart").path("result").get(0).path("meta");

                    BigDecimal price = BigDecimal.valueOf(meta.path("regularMarketPrice").asDouble(0.0)).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal prevClose = BigDecimal.valueOf(meta.path("chartPreviousClose").asDouble(0.0));
                    BigDecimal changePct = BigDecimal.ZERO;

                    if (prevClose.compareTo(BigDecimal.ZERO) > 0) {
                        changePct = price.subtract(prevClose).divide(prevClose, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
                    }

                    long volume = meta.path("regularMarketVolume").asLong(0L);
                    String name = meta.has("shortName") && !meta.path("shortName").isNull() ? meta.path("shortName").asText() : sym;

                    if (price.compareTo(BigDecimal.ZERO) > 0) {
                        MarketAssetDto dto = new MarketAssetDto();
                        dto.setSymbol(sym);
                        dto.setName(name);
                        dto.setAssetType(assetType);
                        dto.setPrice(price);
                        dto.setChangePercent(changePct);
                        dto.setVolume(volume);

                        dto.setYahooSymbol(sym);
                        dto.setChartType("CANDLE");

                        if (sym.endsWith(".IS")) {
                            dto.setAssetCategory(sym.startsWith("X") || sym.startsWith("BIST") ? "INDEX" : "STOCK");
                        } else {
                            dto.setAssetCategory("GLOBAL_ASSET");
                        }

                        list.add(dto);
                        successCount++;
                    }
                }
                Thread.sleep(100);
            } catch (Exception e) {
                log.warn("[YAHOO] Failed to fetch data for symbol: {}. Reason: {}", sym, e.getMessage());
            }
        }

        log.info("[YAHOO] Fetched {}/{} {} assets in {} ms.", successCount, symbols.length, assetType, (System.currentTimeMillis() - startTime));
        return list;
    }

    public String resolveYahooSymbol(String symbol) {
        if (symbol == null) return null;
        String upperSymbol = symbol.toUpperCase(Locale.ENGLISH);

        // 🚀 BÜYÜK DÜZELTME: Tahvil ETF'lerini (HYG, LQD, BND, AGG, IEF, SHY) buraya ekledik!
        List<String> knownGlobalEtfs = Arrays.asList("SPY", "GLD", "TLT", "VNQ", "DIA", "IWM", "VTI", "VOO", "HYG", "LQD", "BND", "AGG", "IEF", "SHY");
        if (knownGlobalEtfs.contains(upperSymbol)) {
            return upperSymbol;
        }

        if (upperSymbol.contains("-USD")) return upperSymbol;
        if (upperSymbol.length() == 3) return upperSymbol + "TRY=X";
        if (upperSymbol.equals("XU100") || upperSymbol.equals("BIST100")) return "XU100.IS";
        if (upperSymbol.equals("XU030") || upperSymbol.equals("BIST30")) return "XU030.IS";
        if (upperSymbol.equals("XBANK") || upperSymbol.equals("BISTBANKA")) return "XBANK.IS";
        if (upperSymbol.equals("XUSIN") || upperSymbol.equals("BISTSINAI")) return "XUSIN.IS";

        return symbol;
    }

    public List<HistoricalDataDto> fetchYahooChartCore(String yahooSymbol, String range, String interval, String startDate, String endDate) {
        long startTime = System.currentTimeMillis();
        List<HistoricalDataDto> dataList = new ArrayList<>();

        try {
            HttpEntity<String> entity = new HttpEntity<>(HttpHeadersUtil.getYahooFinanceHeaders());

            String mappedRange = (range != null) ? range.toLowerCase(Locale.ENGLISH) : "1mo";
            if (mappedRange.equals("1a")) mappedRange = "1mo";
            else if (mappedRange.equals("3a")) mappedRange = "3mo";
            else if (mappedRange.equals("6a")) mappedRange = "6mo";

            String activeInterval = ("1d".equalsIgnoreCase(mappedRange)) ? "15m" : interval;
            String url;

            if ("custom".equalsIgnoreCase(mappedRange) && startDate != null && !startDate.isEmpty()) {
                long p1 = LocalDate.parse(startDate).atStartOfDay(ZoneId.systemDefault()).toEpochSecond();
                long p2 = LocalDate.parse(endDate).plusDays(1).atStartOfDay(ZoneId.systemDefault()).toEpochSecond();
                url = String.format("https://query1.finance.yahoo.com/v8/finance/chart/%s?period1=%d&period2=%d&interval=%s", yahooSymbol, p1, p2, activeInterval);
            } else {
                url = String.format("https://query1.finance.yahoo.com/v8/finance/chart/%s?range=%s&interval=%s", yahooSymbol, mappedRange, activeInterval);
            }

            ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
            if (response.getBody() == null) return dataList;

            JsonNode resultNode = response.getBody().path("chart").path("result");
            if (resultNode.isMissingNode() || resultNode.isEmpty() || resultNode.isNull()) return dataList;

            JsonNode result = resultNode.get(0);
            JsonNode timestamps = result.path("timestamp");
            JsonNode quote = result.path("indicators").path("quote").get(0);

            if (timestamps != null && !timestamps.isMissingNode() && timestamps.isArray()) {
                for (int i = 0; i < timestamps.size(); i++) {
                    JsonNode cNode = quote.path("close").get(i);
                    if (cNode == null || cNode.isNull() || cNode.isMissingNode()) continue;

                    HistoricalDataDto dto = new HistoricalDataDto();
                    long ts = timestamps.get(i).asLong();
                    dto.setTimestamp(ts * 1000);
                    dto.setDate(Instant.ofEpochSecond(ts).atZone(ZoneId.systemDefault()).toLocalDate());

                    JsonNode oNode = quote.path("open").get(i);
                    JsonNode hNode = quote.path("high").get(i);
                    JsonNode lNode = quote.path("low").get(i);
                    JsonNode vNode = quote.path("volume").get(i);

                    dto.setOpen(BigDecimal.valueOf(oNode != null && !oNode.isNull() ? oNode.asDouble() : cNode.asDouble()).setScale(4, RoundingMode.HALF_UP));
                    dto.setHigh(BigDecimal.valueOf(hNode != null && !hNode.isNull() ? hNode.asDouble() : cNode.asDouble()).setScale(4, RoundingMode.HALF_UP));
                    dto.setLow(BigDecimal.valueOf(lNode != null && !lNode.isNull() ? lNode.asDouble() : cNode.asDouble()).setScale(4, RoundingMode.HALF_UP));
                    dto.setClose(BigDecimal.valueOf(cNode.asDouble()).setScale(4, RoundingMode.HALF_UP));
                    dto.setPrice(dto.getClose());
                    dto.setVolume(vNode != null && !vNode.isNull() ? vNode.asLong() : 0L);

                    dataList.add(dto);
                }
            }
            log.debug("[YAHOO CHART] Fetched {} historical data points for {} in {} ms.", dataList.size(), yahooSymbol, (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.error("[YAHOO CHART] Error fetching historical data for {}: {}", yahooSymbol, e.getMessage());
        }
        return dataList;
    }
}