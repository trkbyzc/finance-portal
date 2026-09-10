package com.financeportal.service.market;

import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import com.financeportal.client.yahoo.YahooQuoteClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketSyncService {

    private final YahooQuoteClient yahooFinanceClient;
    private final CacheService cacheService;

    // Her saat Yahoo Finance'ten tahvil/bono fiyatlarını çeker ve 60 dakika TTL ile cache'e yazar.
    @Scheduled(fixedRateString = "${app.sync.market-hourly-rate-ms:3600000}")
    public void fetchBonds() {
        String[] bondSymbols = {"^TNX", "^IRX", "^TYX", "^FVX", "TLT", "IEF", "SHY", "BND", "AGG", "LQD", "HYG"};
        List<MarketAssetDto> list = yahooFinanceClient.fetchQuotes(bondSymbols, "TAHVİL / BONO");
        if (list != null && !list.isEmpty()) cacheService.save("cache:bonds", list, 60);
    }

    // Her 5 dakikada vadeli işlem (futures) fiyatlarını çeker; daha kısa TTL (5 dk) ile cache'e yazar.
    @Scheduled(fixedRateString = "${app.sync.market-fast-rate-ms:300000}")
    public void fetchFutures() {
        List<MarketAssetDto> list = yahooFinanceClient.fetchQuotes(new String[]{"ES=F", "NQ=F", "GC=F", "CL=F"}, "VIOP / VADELİ İŞLEM");
        if (list != null && !list.isEmpty()) cacheService.save("cache:futures", list, 5);
    }
}