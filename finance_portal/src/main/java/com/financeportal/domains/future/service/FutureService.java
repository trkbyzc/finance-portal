package com.financeportal.domains.future.service;

import com.financeportal.domains.future.dto.FutureDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import com.financeportal.client.yahoo.YahooQuoteClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FutureService {

    private final YahooQuoteClient yahooFinanceClient;
    private final CacheService cacheService;

    /**
     * Yahoo'dan canlı küresel vadeli işlem kotasyonları. Emtia (GC/SI/CL/BZ/NG/HG) ile
     * <b>kasıtlı olarak overlap yok</b> — onları CommodityService taşıyor. Bu domain
     * sadece türev araç olarak endeks + tahvil + döviz vadelilerine odaklanıyor:
     *   - US Endeks Vadelileri: ES (S&P 500), NQ (Nasdaq 100), YM (Dow Jones), RTY (Russell 2000)
     *   - US Tahvil Vadelileri: ZN (10Y T-Note), ZB (30Y T-Bond), ZF (5Y T-Note)
     *   - Döviz Vadelileri:     6E (EUR/USD), 6B (GBP/USD), 6J (JPY/USD)
     * 5 dakika cache; PortfolioPriceService fallback chain'inden de çağrılıyor.
     */
    @Value("${app.market.future-symbols}")
    private String[] futureSymbols;

    // Key versiyonlama: Redis'teki eski payload geçersiz kılınmadan yeni sembol seti yayınlanır — code-driven invalidation.
    private static final String CACHE_KEY = "cache:futures:v2";

    @Value("${app.ttl.futures-minutes:5}")
    private int futureCacheTtlMin = 5;

    public List<FutureDto> getFutures() {
        return cacheService.getOrFetch(CACHE_KEY, this::fetchFromYahoo, futureCacheTtlMin);
    }

    /**
     * Boot'ta hemen + 5 dakikada bir cache'i ZORLA tazeler. getFutures'ı çağırmak yerine
     * doğrudan fetch + save kullanılır, böylece cache hit'te eski liste tutulmaz.
     * <p>
     * {@code @EventListener(ApplicationReadyEvent.class)} sayesinde semboller değiştirildiğinde
     * deploy/restart anında Redis'teki eski payload üzerine yazılır — kullanıcının manuel
     * cache temizlemesi gerekmez.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(fixedRateString = "${app.sync.future-rate-ms:300000}")
    public void syncFutures() {
        List<FutureDto> fresh = fetchFromYahoo();
        if (fresh != null && !fresh.isEmpty()) {
            cacheService.save(CACHE_KEY, fresh, futureCacheTtlMin);
            log.info("[FUTURE_SYNC] {} sembol cache'lendi.", fresh.size());
        } else {
            log.warn("[FUTURE_SYNC] Yahoo'dan veri gelmedi, cache dokunulmuyor.");
        }
    }

    private List<FutureDto> fetchFromYahoo() {
        List<MarketAssetDto> raw = yahooFinanceClient.fetchQuotes(futureSymbols, "GLOBAL VADELİ İŞLEM");
        return raw.stream().map(this::mapToDto).toList();
    }

    private FutureDto mapToDto(MarketAssetDto m) {
        FutureDto f = new FutureDto();
        f.setSymbol(m.getSymbol()); f.setName(m.getName()); f.setAssetType(m.getAssetType());
        f.setPrice(m.getPrice()); f.setChangePercent(m.getChangePercent()); f.setVolume(m.getVolume());
        f.setYahooSymbol(m.getYahooSymbol()); f.setChartType(m.getChartType()); f.setAssetCategory(m.getAssetCategory());
        return f;
    }
}