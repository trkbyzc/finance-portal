package com.financeportal.domains.crypto.service;

import com.financeportal.domains.crypto.client.CoinGeckoClient;
import com.financeportal.domains.crypto.dto.CryptoDto;
import com.financeportal.service.cache.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CryptoSyncService {

    private final CoinGeckoClient coinGeckoClient;
    private final CacheService cacheService;
    private final CryptoIdRegistry cryptoIdRegistry;

    // CoinGecko'dan kripto fiyatlarını çekip Redis'e yazar; cache TTL ile hizalı 5 dk aralık, başarısızlık non-fatal.
    @Scheduled(fixedRate = 300000)
    public void fetchAndCacheCryptoRates() {
        long startTime = System.currentTimeMillis();
        List<CryptoDto> rates = coinGeckoClient.fetchCryptoRates();
        if (rates != null && !rates.isEmpty()) {
            cacheService.save("cache:crypto", rates, 5);
            cryptoIdRegistry.update(rates); // sembol→geckoId eşlemesini tazele (grafik fallback'i kullanır)
            log.info("[CRYPTO_SYNC] Successfully updated {} cryptocurrencies from CoinGecko in {} ms.", rates.size(), (System.currentTimeMillis() - startTime));
        } else {
            log.warn("[CRYPTO_SYNC] Failed to update cryptocurrency rates.");
        }
    }
}
