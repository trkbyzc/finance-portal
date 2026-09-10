package com.financeportal.domains.crypto.client;

import com.financeportal.domains.crypto.dto.CryptoDto;
import com.financeportal.domains.crypto.dto.CryptoFundamentalsDto;
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

    /**
     * Tek bir kripto için temel veri (piyasa değeri, sıra, 24s hacim/aralık, arz, ATH/ATL).
     * CoinGecko /coins/markets?ids={geckoId} endpoint'inden; bulunamazsa null.
     */
    public CryptoFundamentalsDto fetchCoinFundamentals(String geckoId) {
        if (geckoId == null || geckoId.isBlank()) return null;
        try {
            HttpEntity<String> entity = new HttpEntity<>(HttpHeadersUtil.getCoinGeckoHeaders());
            String url = String.format(
                    "%s/coins/markets?vs_currency=usd&ids=%s&price_change_percentage=24h&sparkline=false",
                    coinGeckoBaseUrl, geckoId.trim());
            ResponseEntity<List<Object>> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity,
                    new org.springframework.core.ParameterizedTypeReference<List<Object>>() {});
            List<Object> body = response.getBody();
            if (body == null || body.isEmpty()) return null;
            Map<?, ?> c = (Map<?, ?>) body.get(0);

            return CryptoFundamentalsDto.builder()
                    .symbol(str(c.get("symbol")) != null ? str(c.get("symbol")).toUpperCase(Locale.ENGLISH) : null)
                    .name(str(c.get("name")))
                    .priceUsd(dbl(c.get("current_price")))
                    .changePct24h(dbl(c.get("price_change_percentage_24h")))
                    .marketCapRank(lng(c.get("market_cap_rank")))
                    .marketCapUsd(dbl(c.get("market_cap")))
                    .volume24hUsd(dbl(c.get("total_volume")))
                    .high24h(dbl(c.get("high_24h")))
                    .low24h(dbl(c.get("low_24h")))
                    .ath(dbl(c.get("ath")))
                    .athChangePct(dbl(c.get("ath_change_percentage")))
                    .atl(dbl(c.get("atl")))
                    .circulatingSupply(dbl(c.get("circulating_supply")))
                    .totalSupply(dbl(c.get("total_supply")))
                    .maxSupply(dbl(c.get("max_supply")))
                    .build();
        } catch (Exception e) {
            log.warn("[COINGECKO] Temel veri alınamadı '{}': {}", geckoId, e.getMessage());
            return null;
        }
    }

    private static String str(Object o) { return o instanceof String s ? s : null; }
    private static Double dbl(Object o) { return o instanceof Number n ? n.doubleValue() : null; }
    private static Long lng(Object o) { return o instanceof Number n ? n.longValue() : null; }

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
            Number marketCap = (Number) coinData.get("market_cap");
            Number totalVolume = (Number) coinData.get("total_volume");

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

                // CoinGecko'nun verdiği gerçek logo URL'i + coin id (grafik OHLC fallback'i için)
                dto.setImage((String) coinData.get("image"));
                dto.setGeckoId((String) coinData.get("id"));

                if (marketCap != null) dto.setMarketCap(BigDecimal.valueOf(marketCap.doubleValue()));
                if (totalVolume != null) dto.setVolume24h(BigDecimal.valueOf(totalVolume.doubleValue()));

                targetList.add(dto);
            }
        }
    }
}
