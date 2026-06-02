package com.financeportal.domains.crypto.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.util.HttpHeadersUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * CoinGecko OHLC grafik istemcisi — Yahoo ve Binance'te veri bulunamayan coinler için
 * en geniş kapsamlı fallback. CoinGecko listelediği TÜM coinler için OHLC sağlar.
 *
 * Endpoint: /coins/{id}/ohlc?vs_currency=usd&days={days}
 *   Dönüş: [[timestamp_ms, open, high, low, close], ...] (hacim yok).
 *   id, sembolden {@link com.financeportal.domains.crypto.service.CryptoIdRegistry}
 *   ile çözülür. Fiyatlar tam hassasiyetle (BigDecimal(string)) okunur — küçük coinlerde
 *   (SHIB/PEPE) basamak kaybı olmasın.
 */
@Component
@Slf4j
public class CoinGeckoChartClient {

    private final RestTemplate restTemplate;

    @Value("${external-api.coingecko.base-url}")
    private String coinGeckoBaseUrl;

    public CoinGeckoChartClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<HistoricalDataDto> fetchOhlc(String geckoId, String range) {
        long startTime = System.currentTimeMillis();
        List<HistoricalDataDto> dataList = new ArrayList<>();
        if (geckoId == null || geckoId.isBlank()) return dataList;

        try {
            int days = mapRangeToDays(range);
            String url = String.format(Locale.ENGLISH,
                    "%s/coins/%s/ohlc?vs_currency=usd&days=%d", coinGeckoBaseUrl, geckoId, days);

            HttpEntity<String> entity = new HttpEntity<>(HttpHeadersUtil.getCoinGeckoHeaders());
            ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
            JsonNode body = response.getBody();
            if (body == null || !body.isArray() || body.isEmpty()) return dataList;

            for (JsonNode c : body) {
                if (!c.isArray() || c.size() < 5) continue;
                long ts = c.get(0).asLong();
                HistoricalDataDto dto = new HistoricalDataDto();
                dto.setTimestamp(ts);
                dto.setDate(Instant.ofEpochMilli(ts).atZone(ZoneId.systemDefault()).toLocalDate());
                dto.setOpen(new BigDecimal(c.get(1).asText()));
                dto.setHigh(new BigDecimal(c.get(2).asText()));
                dto.setLow(new BigDecimal(c.get(3).asText()));
                BigDecimal close = new BigDecimal(c.get(4).asText());
                dto.setClose(close);
                dto.setPrice(close);
                // CoinGecko OHLC hacim sağlamaz → null (frontend hacim kartını gizler)
                dataList.add(dto);
            }

            log.info("[COINGECKO-CHART] Fetched {} OHLC points for '{}' (days={}) in {} ms.",
                    dataList.size(), geckoId, days, (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.warn("[COINGECKO-CHART] Failed for id '{}': {}", geckoId, e.getMessage());
        }
        return dataList;
    }

    private int mapRangeToDays(String range) {
        if (range == null) return 30;
        return switch (range.toLowerCase(Locale.ENGLISH)) {
            case "1d", "1g" -> 1;
            case "5d", "1w", "1h" -> 7;
            case "1mo", "1a", "1m" -> 30;
            case "3mo", "3a", "3m" -> 90;
            case "6mo", "6a", "6m" -> 180;
            case "1y", "ytd" -> 365;
            case "5y" -> 365; // CoinGecko free tier üst sınırı 365 gün
            default -> 30;
        };
    }
}
