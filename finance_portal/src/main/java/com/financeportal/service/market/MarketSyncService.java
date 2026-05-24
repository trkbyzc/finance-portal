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

    // ŞUNA DÖNÜŞTÜRÜN:
    private final YahooQuoteClient yahooFinanceClient; // (Veya ismini yahooQuoteClient yapın)
    private final CacheService cacheService;

    @Scheduled(fixedRate = 3600000)
    public void fetchBonds() {
        String[] bondSymbols = {"^TNX", "^IRX", "^TYX", "^FVX", "TLT", "IEF", "SHY", "BND", "AGG", "LQD", "HYG"};
        List<MarketAssetDto> list = yahooFinanceClient.fetchQuotes(bondSymbols, "TAHVİL / BONO");
        if (list != null && !list.isEmpty()) cacheService.save("cache:bonds", list, 60);
    }

    @Scheduled(fixedRate = 300000)
    public void fetchFutures() {
        List<MarketAssetDto> list = yahooFinanceClient.fetchQuotes(new String[]{"ES=F", "NQ=F", "GC=F", "CL=F"}, "VIOP / VADELİ İŞLEM");
        if (list != null && !list.isEmpty()) cacheService.save("cache:futures", list, 5);
    }
}