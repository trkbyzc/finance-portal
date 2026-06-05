package com.financeportal.domains.fund.service;

import com.financeportal.client.yahoo.YahooQuoteClient;
import com.financeportal.domains.fund.client.TefasFundClient;
import com.financeportal.domains.fund.dto.FundDto;
import com.financeportal.service.cache.CacheService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FundServiceTest {

    @Mock
    private TefasFundClient tefasClient;

    @Mock
    private YahooQuoteClient yahooClient;

    @Mock
    private CacheService cacheService;

    @Mock
    private com.financeportal.domains.stock.client.TradingViewLogoClient logoClient;

    @InjectMocks
    private FundService service;

    @org.junit.jupiter.api.BeforeEach
    void stubLogos() {
        when(logoClient.usLogos(any())).thenReturn(java.util.Map.of());
    }

    // -------- getGlobalFunds --------

    @Test
    void getGlobalFunds_delegatesToCacheWith60MinTtl() {
        when(cacheService.getOrFetch(anyString(), any(), anyLong())).thenReturn(List.of());

        service.getGlobalFunds();

        verify(cacheService).getOrFetch(eq("cache:global_funds"), any(), eq(60L));
    }

    // -------- getTrFunds --------

    @Test
    void getTrFunds_delegatesToCacheWithTefasFetcher() {
        when(cacheService.getOrFetch(anyString(), any(), anyLong())).thenReturn(List.of());

        service.getTrFunds();

        verify(cacheService).getOrFetch(eq("cache:tr_funds"), any(), eq(60L));
    }

    // -------- syncTrFunds (forced refresh) --------

    @Test
    void syncTrFunds_nonEmptyResult_savesToCache() {
        FundDto fund = new FundDto();
        fund.setSymbol("AKB");
        when(tefasClient.fetchTefasFunds()).thenReturn(List.of(fund));

        service.syncTrFunds();

        verify(cacheService).save(eq("cache:tr_funds"), any(), eq(60L));
    }

    @Test
    void syncTrFunds_nullResult_doesNotTouchCache() {
        when(tefasClient.fetchTefasFunds()).thenReturn(null);

        service.syncTrFunds();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void syncTrFunds_emptyResult_doesNotTouchCache() {
        when(tefasClient.fetchTefasFunds()).thenReturn(List.of());

        service.syncTrFunds();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void syncTrFunds_savesAllResults() {
        List<FundDto> funds = List.of(new FundDto(), new FundDto(), new FundDto());
        when(tefasClient.fetchTefasFunds()).thenReturn(funds);

        service.syncTrFunds();

        org.mockito.ArgumentCaptor<Object> payload = org.mockito.ArgumentCaptor.forClass(Object.class);
        verify(cacheService).save(eq("cache:tr_funds"), payload.capture(), eq(60L));
        @SuppressWarnings("unchecked")
        List<FundDto> saved = (List<FundDto>) payload.getValue();
        assertEquals(3, saved.size());
    }

    // -------- syncGlobalFunds (forced refresh via getGlobalFunds) --------

    @Test
    void syncGlobalFunds_callsGetGlobalFunds() {
        when(cacheService.getOrFetch(anyString(), any(), anyLong())).thenReturn(List.of());

        service.syncGlobalFunds();

        // getGlobalFunds → cacheService.getOrFetch çağrısı
        verify(cacheService).getOrFetch(eq("cache:global_funds"), any(), eq(60L));
    }
}
