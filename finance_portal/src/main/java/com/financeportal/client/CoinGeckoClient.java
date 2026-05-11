package com.financeportal.integration;

import com.financeportal.model.dto.CurrencyRateDto;
import com.financeportal.util.HttpHeadersUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class CoinGeckoClient {

    private final RestTemplate restTemplate;

    private static final List<String> BLACKLIST_KEYWORDS = Arrays.asList(
            "fund", "yield", "wrapped", "etf", "index", "tokenized", "heloc", "liquid", "bridged", "staked", "protocol"
    );

    public List<CurrencyRateDto> fetchCryptoRates() {
        long startTime = System.currentTimeMillis();
        List<CurrencyRateDto> allRates = new ArrayList<>();

        for (int page = 1; page <= 2; page++) {
            try {
                HttpEntity<String> entity = new HttpEntity<>(HttpHeadersUtil.getCoinGeckoHeaders());
                String url = String.format(
                        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=%d&sparkline=false",
                        page
                );

                ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);

                if (response.getBody() != null) {
                    processCoins(response.getBody(), allRates);
                }

                Thread.sleep(500);

            } catch (Exception e) {
                log.warn("[COINGECKO] Failed to fetch page {}: {}", page, e.getMessage());
            }
        }

        log.info("[COINGECKO] Fetched {} crypto assets in {} ms.", allRates.size(), (System.currentTimeMillis() - startTime));
        return allRates;
    }

    private void processCoins(List<?> rawCoins, List<CurrencyRateDto> targetList) {
        for (Object obj : rawCoins) {
            Map<?, ?> coinData = (Map<?, ?>) obj;
            String name = ((String) coinData.get("name")).toLowerCase(Locale.ENGLISH);
            String symbol = ((String) coinData.get("symbol")).toUpperCase(Locale.ENGLISH);

            if (symbol.length() > 5) continue;
            if (symbol.contains("_") || symbol.contains("-")) continue;
            if (BLACKLIST_KEYWORDS.stream().anyMatch(name::contains)) continue;

            Number currentPrice = (Number) coinData.get("current_price");
            Number changePct24h = (Number) coinData.get("price_change_percentage_24h");

            if (currentPrice != null) {
                BigDecimal p = BigDecimal.valueOf(currentPrice.doubleValue());
                BigDecimal changePct = changePct24h != null ? BigDecimal.valueOf(changePct24h.doubleValue()) : BigDecimal.ZERO;

                CurrencyRateDto dto = new CurrencyRateDto();
                dto.setCurrencyCode(symbol);
                dto.setCurrencyName("Kripto - " + coinData.get("name"));
                dto.setForexBuying(p.multiply(BigDecimal.valueOf(0.999)));
                dto.setForexSelling(p.multiply(BigDecimal.valueOf(1.001)));
                dto.setChangePercent(changePct);

                // Automatic mapping for frontend consumption
                dto.setYahooSymbol(symbol + "-USD");
                dto.setChartType("CANDLE");
                dto.setAssetCategory("CRYPTO");

                targetList.add(dto);
            }
        }
    }
}