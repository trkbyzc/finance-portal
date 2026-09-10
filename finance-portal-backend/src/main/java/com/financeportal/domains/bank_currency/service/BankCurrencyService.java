package com.financeportal.domains.bank_currency.service;

import com.financeportal.config.datasource.DataSourceKeys;
import com.financeportal.config.datasource.DataSourcePolicy;
import com.financeportal.domains.bank_currency.client.HesapkurduIntegrationClient;
import com.financeportal.domains.bank_currency.dto.BankCurrencyDto;
import com.financeportal.service.cache.CacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BankCurrencyService {

    private final HesapkurduIntegrationClient hesapkurduIntegrationClient;
    private final CacheService cacheService;
    private final DataSourcePolicy dataSourcePolicy;

    public List<BankCurrencyDto> getBankRates() {
        // Politika ÖNBELLEKTEN ÖNCE kontrol edilir — gerekçesi IpoService.getIPOCalendar'da.
        dataSourcePolicy.check(DataSourceKeys.HESAPKURDU);
        return cacheService.getOrFetch("cache:bank_currencies", hesapkurduIntegrationClient::fetchLiveBankRates, 5);
    }
}