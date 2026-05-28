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

    /**
     * Yahoo'dan canlı küresel vadeli işlem kotasyonları. 4 ana grup:
     *   - US Endeks Vadelileri: ES (S&P 500), NQ (Nasdaq 100), YM (Dow Jones), RTY (Russell 2000)
     *   - Enerji Vadelileri:    CL (WTI Petrol), BZ (Brent Petrol), NG (Doğalgaz)
     *   - Metal Vadelileri:     GC (Altın), SI (Gümüş), HG (Bakır)
     *   - Tahvil Vadelileri:    ZN (10Y T-Note)
     * 5 dakika cache; PortfolioPriceService fallback chain'inden de çağrılıyor.
     */
    private static final String[] FUTURE_SYMBOLS = {
            "ES=F", "NQ=F", "YM=F", "RTY=F",
            "CL=F", "BZ=F", "NG=F",
            "GC=F", "SI=F", "HG=F",
            "ZN=F"
    };

    public List<FutureDto> getFutures() {
        return cacheService.getOrFetch("cache:futures", () -> {
            List<MarketAssetDto> raw = yahooFinanceClient.fetchQuotes(FUTURE_SYMBOLS, "GLOBAL VADELİ İŞLEM");
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