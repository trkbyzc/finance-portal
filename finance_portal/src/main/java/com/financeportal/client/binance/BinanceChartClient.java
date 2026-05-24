package com.financeportal.client.binance;

import com.fasterxml.jackson.databind.JsonNode;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
@Slf4j
public class BinanceChartClient {

    private final RestTemplate restTemplate;

    @Value("${external-api.binance.base-url}")
    private String binanceBaseUrl;

    public BinanceChartClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<HistoricalDataDto> fetchKlines(String binanceSymbol, String range) {
        long startTime = System.currentTimeMillis();
        List<HistoricalDataDto> dataList = new ArrayList<>();

        try {
            String interval = mapRangeToInterval(range);
            int limit = mapRangeToLimit(range);

            String url = String.format("%s/api/v3/klines?symbol=%s&interval=%s&limit=%d",
                    binanceBaseUrl, binanceSymbol, interval, limit);

            ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);
            JsonNode body = response.getBody();
            if (body == null || !body.isArray() || body.isEmpty()) return dataList;

            for (JsonNode kline : body) {
                if (!kline.isArray() || kline.size() < 6) continue;

                long openTime = kline.get(0).asLong();
                BigDecimal open = parsePrice(kline.get(1).asText());
                BigDecimal high = parsePrice(kline.get(2).asText());
                BigDecimal low = parsePrice(kline.get(3).asText());
                BigDecimal close = parsePrice(kline.get(4).asText());
                long volume = (long) Double.parseDouble(kline.get(5).asText());

                HistoricalDataDto dto = new HistoricalDataDto();
                dto.setTimestamp(openTime);
                dto.setDate(Instant.ofEpochMilli(openTime).atZone(ZoneId.systemDefault()).toLocalDate());
                dto.setOpen(open);
                dto.setHigh(high);
                dto.setLow(low);
                dto.setClose(close);
                dto.setPrice(close);
                dto.setVolume(volume);

                dataList.add(dto);
            }

            log.info("[BINANCE-CHART] Fetched {} klines for '{}' ({}) in {} ms.",
                    dataList.size(), binanceSymbol, interval, (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.warn("[BINANCE-CHART] Failed for symbol '{}': {}", binanceSymbol, e.getMessage());
        }

        return dataList;
    }

    private BigDecimal parsePrice(String raw) {
        return new BigDecimal(raw).setScale(8, RoundingMode.HALF_UP);
    }

    private String mapRangeToInterval(String range) {
        if (range == null) return "1d";
        return switch (range.toLowerCase(Locale.ENGLISH)) {
            case "1d", "1g" -> "15m";
            case "5d", "1w", "1h" -> "1h";
            case "1mo", "1a", "1m", "3mo", "3a", "3m", "6mo", "6a", "6m", "1y", "ytd" -> "1d";
            case "5y" -> "1w";
            default -> "1d";
        };
    }

    private int mapRangeToLimit(String range) {
        if (range == null) return 30;
        return switch (range.toLowerCase(Locale.ENGLISH)) {
            case "1d", "1g" -> 96;     // 24 saat * 4 (15m bar)
            case "5d", "1w", "1h" -> 168; // 7 gün * 24 saat
            case "1mo", "1a", "1m" -> 30;
            case "3mo", "3a", "3m" -> 90;
            case "6mo", "6a", "6m" -> 180;
            case "1y", "ytd" -> 365;
            case "5y" -> 260;           // 5 yıl * 52 hafta
            default -> 30;
        };
    }
}
