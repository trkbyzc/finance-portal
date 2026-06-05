package com.financeportal.domains.crypto.service;

import com.financeportal.domains.crypto.client.CoinGeckoClient;
import com.financeportal.domains.crypto.client.FearGreedClient;
import com.financeportal.domains.crypto.dto.CryptoDto;
import com.financeportal.domains.crypto.dto.FearGreedDto;
import com.financeportal.service.cache.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CryptoService {

    private final CoinGeckoClient coinGeckoClient;
    private final FearGreedClient fearGreedClient;
    private final CacheService cacheService;

    public List<CryptoDto> getCryptoRates() {
        return cacheService.getOrFetch("cache:crypto", coinGeckoClient::fetchCryptoRates, 5);
    }

    /** Kripto detay "Temel Veriler" kartı için CoinGecko market verisi (frontend react-query cache'ler). */
    public com.financeportal.domains.crypto.dto.CryptoFundamentalsDto getFundamentals(String geckoId) {
        if (geckoId == null || geckoId.isBlank()) return null;
        return coinGeckoClient.fetchCoinFundamentals(geckoId);
    }

    /** Crypto Fear &amp; Greed Index — tüm günlük geçmiş (alternative.me), 1 saat cache. */
    public List<FearGreedDto> getFearGreed() {
        return cacheService.getOrFetch("cache:fear-greed", fearGreedClient::fetchAll, 60);
    }
}