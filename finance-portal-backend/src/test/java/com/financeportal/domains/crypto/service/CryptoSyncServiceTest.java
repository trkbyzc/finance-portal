package com.financeportal.domains.crypto.service;

import com.financeportal.domains.crypto.client.CoinGeckoClient;
import com.financeportal.domains.crypto.dto.CryptoDto;
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
class CryptoSyncServiceTest {

    @Mock private CoinGeckoClient coinGeckoClient;
    @Mock private CacheService cacheService;
    @Mock private CryptoIdRegistry cryptoIdRegistry;

    @InjectMocks private CryptoSyncService service;

    @Test
    void fetch_nonEmpty_savesCacheAndUpdatesRegistry() {
        CryptoDto btc = new CryptoDto();
        btc.setCurrencyCode("BTC");
        when(coinGeckoClient.fetchCryptoRates()).thenReturn(List.of(btc));

        service.fetchAndCacheCryptoRates();

        verify(cacheService).save(eq("cache:crypto"), any(), eq(5L));
        verify(cryptoIdRegistry).update(List.of(btc));
    }

    @Test
    void fetch_empty_doesNotSaveOrUpdate() {
        when(coinGeckoClient.fetchCryptoRates()).thenReturn(List.of());

        service.fetchAndCacheCryptoRates();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
        verify(cryptoIdRegistry, never()).update(any());
    }

    @Test
    void fetch_null_doesNotSaveOrUpdate() {
        when(coinGeckoClient.fetchCryptoRates()).thenReturn(null);

        service.fetchAndCacheCryptoRates();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
        verify(cryptoIdRegistry, never()).update(any());
    }
}
