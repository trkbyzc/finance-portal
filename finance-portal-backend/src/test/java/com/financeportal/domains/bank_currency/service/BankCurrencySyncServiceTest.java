package com.financeportal.domains.bank_currency.service;

import com.financeportal.domains.bank_currency.client.HesapkurduIntegrationClient;
import com.financeportal.domains.bank_currency.dto.BankCurrencyDto;
import com.financeportal.service.cache.CacheService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BankCurrencySyncServiceTest {

    @Mock private HesapkurduIntegrationClient hesapkurduClient;
    @Mock private CacheService cacheService;

    @InjectMocks private BankCurrencySyncService service;

    @Test
    void fetch_nonEmpty_savesToCache() {
        BankCurrencyDto dto = new BankCurrencyDto();
        when(hesapkurduClient.fetchLiveBankRates()).thenReturn(List.of(dto));

        service.fetchAndCacheBankRates();

        verify(cacheService).save(eq("cache:bank_currencies"), any(), eq(5L));
    }

    @Test
    void fetch_empty_doesNotSave() {
        when(hesapkurduClient.fetchLiveBankRates()).thenReturn(List.of());

        service.fetchAndCacheBankRates();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void fetch_null_doesNotSave() {
        when(hesapkurduClient.fetchLiveBankRates()).thenReturn(null);

        service.fetchAndCacheBankRates();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }
}
