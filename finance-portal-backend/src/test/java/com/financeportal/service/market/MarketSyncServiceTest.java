package com.financeportal.service.market;

import com.financeportal.client.yahoo.YahooQuoteClient;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
class MarketSyncServiceTest {

    @Mock private YahooQuoteClient yahooClient;
    @Mock private CacheService cacheService;

    @InjectMocks private MarketSyncService service;

    @Test
    void fetchBonds_nonEmpty_savesWith60MinTtl() {
        MarketAssetDto bond = new MarketAssetDto();
        bond.setSymbol("TLT");
        when(yahooClient.fetchQuotes(any(String[].class), eq("TAHVİL / BONO"))).thenReturn(List.of(bond));

        service.fetchBonds();

        verify(cacheService).save(eq("cache:bonds"), any(), eq(60L));
    }

    @Test
    void fetchBonds_empty_doesNotSave() {
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        service.fetchBonds();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void fetchBonds_null_doesNotSave() {
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(null);

        service.fetchBonds();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void fetchBonds_passesAllBondSymbols() {
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        service.fetchBonds();

        ArgumentCaptor<String[]> symCap = ArgumentCaptor.forClass(String[].class);
        verify(yahooClient).fetchQuotes(symCap.capture(), eq("TAHVİL / BONO"));
        // 11 sembol: ^TNX, ^IRX, ^TYX, ^FVX, TLT, IEF, SHY, BND, AGG, LQD, HYG
        org.junit.jupiter.api.Assertions.assertEquals(11, symCap.getValue().length);
    }

    @Test
    void fetchFutures_nonEmpty_savesWith5MinTtl() {
        MarketAssetDto fut = new MarketAssetDto();
        fut.setSymbol("ES=F");
        when(yahooClient.fetchQuotes(any(String[].class), eq("VIOP / VADELİ İŞLEM"))).thenReturn(List.of(fut));

        service.fetchFutures();

        verify(cacheService).save(eq("cache:futures"), any(), eq(5L));
    }

    @Test
    void fetchFutures_empty_doesNotSave() {
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        service.fetchFutures();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void fetchFutures_null_doesNotSave() {
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(null);

        service.fetchFutures();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void fetchFutures_passesAllFutureSymbols() {
        when(yahooClient.fetchQuotes(any(String[].class), anyString())).thenReturn(List.of());

        service.fetchFutures();

        ArgumentCaptor<String[]> symCap = ArgumentCaptor.forClass(String[].class);
        verify(yahooClient).fetchQuotes(symCap.capture(), eq("VIOP / VADELİ İŞLEM"));
        // 4 sembol: ES=F, NQ=F, GC=F, CL=F
        org.junit.jupiter.api.Assertions.assertEquals(4, symCap.getValue().length);
    }
}
