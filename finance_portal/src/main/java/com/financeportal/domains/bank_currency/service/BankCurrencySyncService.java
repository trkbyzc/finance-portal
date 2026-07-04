package com.financeportal.domains.bank_currency.service;

import com.financeportal.domains.bank_currency.client.HesapkurduIntegrationClient;
import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.service.cache.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BankCurrencySyncService {

    private final HesapkurduIntegrationClient hesapkurduIntegrationClient;
    private final CacheService cacheService;

    @Scheduled(fixedRateString = "${app.sync.bank-currency-rate-ms:300000}")
    public void fetchAndCacheBankRates() {
        long startTime = System.currentTimeMillis();
        List<com.financeportal.domains.bank_currency.dto.BankCurrencyDto> rates = hesapkurduIntegrationClient.fetchLiveBankRates();
        if (rates != null && !rates.isEmpty()) {
            cacheService.save("cache:bank_currencies", rates, 5);
            log.info("[BANK_RATES_SYNC] Successfully updated {} bank rates from Hesapkurdu in {} ms.", rates.size(), (System.currentTimeMillis() - startTime));
        } else {
            log.warn("[BANK_RATES_SYNC] Failed to update bank rates.");
        }
    }
}