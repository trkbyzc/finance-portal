package com.financeportal.domains.crypto.client;

import com.financeportal.domains.crypto.dto.CryptoDto;
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
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class CoinGeckoClient {

    private final RestTemplate restTemplate;

    @Value("${external-api.coingecko.base-url}")
    private String coinGeckoBaseUrl;

    private static final List<String> BLACKLIST_KEYWORDS = Arrays.asList(
            "fund", "yield", "wrapped", "etf", "index", "tokenized", "heloc", "liquid", "bridged", "staked", "protocol"
    );

    public List<CryptoDto> fetchCryptoRates() {
        long startTime = System.currentTimeMillis();
        List<CryptoDto> allRates = new ArrayList<>();

        for (int page = 1; page <= 2; page++) {
            try {
                HttpEntity<String> entity = new HttpEntity<>(HttpHeadersUtil.getCoinGeckoHeaders());
                String url = String.format(
                        "%s/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=%d&sparkline=false",
                        coinGeckoBaseUrl, page
                );

                ResponseEntity<List<Object>> response = restTemplate.exchange(
                        url, HttpMethod.GET, entity,
                        new org.springframework.core.ParameterizedTypeReference<List<Object>>() {});

                if (response.getBody() != null) {
                    processCoins(response.getBody(), allRates);
                }

                Thread.sleep(500);

            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                log.warn("[COINGECKO] Interrupted on page {}", page);
                break;
            } catch (Exception e) {
                log.warn("[COINGECKO] Failed to fetch page {}: {}", page, e.getMessage());
            }
        }

        log.info("[COINGECKO] Fetched {} crypto assets in {} ms.", allRates.size(), (System.currentTimeMillis() - startTime));
        return allRates;
    }

    private void processCoins(List<?> rawCoins, List<CryptoDto> targetList) {
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

                CryptoDto dto = new CryptoDto();
                dto.setCurrencyCode(symbol);
                dto.setCurrencyName("Kripto - " + coinData.get("name"));
                dto.setForexBuying(p.multiply(BigDecimal.valueOf(0.999)));
                dto.setForexSelling(p.multiply(BigDecimal.valueOf(1.001)));
                dto.setChangePercent(changePct);

                dto.setYahooSymbol(symbol + "-USD");
                dto.setChartType("CANDLE");
                dto.setAssetCategory("CRYPTO");

                targetList.add(dto);
            }
        }
    }
}
