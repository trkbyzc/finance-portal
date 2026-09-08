package com.financeportal.client.yahoo;

import com.fasterxml.jackson.databind.JsonNode;
import com.financeportal.config.datasource.DataSourceKeys;
import com.financeportal.config.datasource.DataSourcePolicy;
import com.financeportal.model.dto.market.MarketAssetDto;
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
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class YahooQuoteClient {

    private final RestTemplate restTemplate;
    private final DataSourcePolicy dataSourcePolicy;

    @Value("${external-api.yahoo.base-url}")
    private String yahooBaseUrl;

    public List<MarketAssetDto> fetchQuotes(String[] symbols, String assetType) {
        // Kaynak bu ortamda sunulmuyorsa dış çağrı hiç yapılmaz (bkz. DataSourcePolicy).
        dataSourcePolicy.check(DataSourceKeys.YAHOO);

        long startTime = System.currentTimeMillis();
        HttpEntity<String> entity = new HttpEntity<>(HttpHeadersUtil.getYahooFinanceHeaders());
        List<MarketAssetDto> list = new ArrayList<>();
        int successCount = 0;

        for (String sym : symbols) {
            try {
                String url = yahooBaseUrl + sym + "?range=1d&interval=1d";
                ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);

                if (response.getBody() != null) {
                    JsonNode meta = response.getBody().path("chart").path("result").get(0).path("meta");

                    BigDecimal price = BigDecimal.valueOf(meta.path("regularMarketPrice").asDouble(0.0)).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal prevClose = BigDecimal.valueOf(meta.path("chartPreviousClose").asDouble(0.0));
                    BigDecimal changePct = BigDecimal.ZERO;

                    if (prevClose.compareTo(BigDecimal.ZERO) > 0) {
                        changePct = price.subtract(prevClose).divide(prevClose, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
                    }

                    if (price.compareTo(BigDecimal.ZERO) > 0) {
                        MarketAssetDto dto = new MarketAssetDto();
                        dto.setSymbol(sym);
                        dto.setName(meta.has("shortName") && !meta.path("shortName").isNull() ? meta.path("shortName").asText() : sym);
                        dto.setAssetType(assetType);
                        dto.setPrice(price);
                        dto.setChangePercent(changePct);
                        dto.setVolume(meta.path("regularMarketVolume").asLong(0L));
                        dto.setYahooSymbol(sym);
                        dto.setChartType("CANDLE");
                        dto.setAssetCategory(sym.endsWith(".IS") ? (sym.startsWith("X") ? "INDEX" : "STOCK") : "GLOBAL_ASSET");

                        list.add(dto);
                        successCount++;
                    }
                }
                Thread.sleep(80); // Rate limit koruması
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                log.warn("[YAHOO-QUOTE] Interrupted while fetching {}", sym);
                break;
            } catch (Exception e) {
                log.warn("[YAHOO-QUOTE] Failed fetching {}: {}", sym, e.getMessage());
            }
        }
        log.info("[YAHOO-QUOTE] Fetched {}/{} {} assets in {} ms.", successCount, symbols.length, assetType, (System.currentTimeMillis() - startTime));
        return list;
    }
}