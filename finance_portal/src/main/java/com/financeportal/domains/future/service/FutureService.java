package com.financeportal.domains.future.service;

import com.financeportal.domains.future.dto.FutureDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import com.financeportal.client.yahoo.YahooQuoteClient;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FutureService {

    // ŞUNA DÖNÜŞTÜRÜN:
    private final YahooQuoteClient yahooFinanceClient; // (Veya ismini yahooQuoteClient yapın)
    private final CacheService cacheService;

    public List<FutureDto> getFutures() {
        return cacheService.getOrFetch("cache:futures", () -> {
            List<MarketAssetDto> raw = yahooFinanceClient.fetchQuotes(new String[]{"ES=F", "NQ=F", "GC=F", "CL=F"}, "GLOBAL VADELİ İŞLEM");
            return raw.stream().map(this::mapToDto).toList();
        }, 5);
    }

    @Scheduled(fixedRate = 300000) // 5 dakikada bir cache yenile
    public void syncFutures() {
        getFutures();
    }

    private FutureDto mapToDto(MarketAssetDto m) {
        FutureDto f = new FutureDto();
        f.setSymbol(m.getSymbol()); f.setName(m.getName()); f.setAssetType(m.getAssetType());
        f.setPrice(m.getPrice()); f.setChangePercent(m.getChangePercent()); f.setVolume(m.getVolume());
        f.setYahooSymbol(m.getYahooSymbol()); f.setChartType(m.getChartType()); f.setAssetCategory(m.getAssetCategory());
        return f;
    }
}