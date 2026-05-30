package com.financeportal.domains.stock.service;

import com.financeportal.domains.stock.client.BistStockClient;
import com.financeportal.domains.stock.dto.StockDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import com.financeportal.client.yahoo.YahooQuoteClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockService {

    private final BistStockClient bistStockClient;
    // ŞUNA DÖNÜŞTÜRÜN:
    private final YahooQuoteClient yahooFinanceClient; // (Veya ismini yahooQuoteClient yapın)
    private final CacheService cacheService;

    private final String[] GLOBAL_STOCK_SYMBOLS = {
            // Mevcut çekirdek (mega-cap + bilinen marka)
            "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "NFLX", "AMD", "INTC",
            "BABA", "JPM", "V", "WMT", "JNJ", "PG", "MA", "HD",
            // Yeni: Nasdaq tech ağırlıklı — yarı iletken + yazılım/cloud
            // Yarı iletken: TSM, ASML, AVGO, QCOM, TXN, AMAT, MU, LRCX, KLAC
            // Yazılım/Cloud:  ADBE, CRM, ORCL
            "TSM", "ASML", "AVGO", "QCOM", "TXN", "AMAT", "MU", "LRCX", "KLAC",
            "ADBE", "CRM", "ORCL"
    };

    public List<StockDto> getStocks() {
        return cacheService.getOrFetch("cache:stocks", this::fetchAndCombineStocks, 5);
    }

    /**
     * Endeks listesi: BIST (5) + US (4) + Crypto (1) = 10 endeks.
     * Frontend ComparisonSection asset picker'ı bu listeden besleniyor — yeni endeks ekleyince
     * UI'da otomatik benchmark olarak seçilebilir hale gelir.
     *   BIST  : XU100, XU030, XU050, XBANK, XUSIN
     *   US    : ^GSPC (S&P 500), ^IXIC (Nasdaq Composite), ^NDX (Nasdaq 100), ^DJI (Dow Jones)
     *   Kripto: BITW (Bitwise 10 Crypto Index Fund — top 10 kripto market-cap ağırlıklı)
     *           ⚠ Yahoo'da gerçek kripto endeksleri (^CMC200/100/500) delisted (son veri 2024-08);
     *             endeks fonu olan BITW canlı ve kavramsal olarak aynı işi görüyor.
     * Yahoo Finance'ten doğrudan çekiliyor; `^` ile başlayan semboller chart endpoint'inde
     * {@link com.financeportal.domains.chart.strategy.impl.YahooDefaultChartStrategy}
     * tarafından yakalanır.
     */
    private static final String[] INDEX_SYMBOLS = {
            "XU100.IS", "XU030.IS", "XU050.IS", "XBANK.IS", "XUSIN.IS",
            "^GSPC", "^IXIC", "^NDX", "^DJI",
            "BITW"
    };

    public List<StockDto> getIndices() {
        return cacheService.getOrFetch("cache:indices", () -> {
            List<MarketAssetDto> raw = yahooFinanceClient.fetchQuotes(INDEX_SYMBOLS, "ENDEKS");
            return raw.stream().map(this::mapToStockDto).toList();
        }, 5);
    }

    // Hafta sonu / piyasa kapalıyken Fintables tick endpoint v=null döner ve liste boşalır.
    // Son başarılı snapshot 48 saat ayrı bir Redis key'inde tutulur; canlı boşsa oradan beslenir.
    private static final String BIST_LAST_GOOD_KEY = "cache:bist:last-good";
    private static final long BIST_LAST_GOOD_TTL_MINUTES = 60 * 48;

    private List<StockDto> fetchAndCombineStocks() {
        List<StockDto> allStocks = new ArrayList<>();
        List<StockDto> trStocks = bistStockClient.fetchTurkishStocks();
        if (trStocks != null && !trStocks.isEmpty()) {
            allStocks.addAll(trStocks);
            cacheService.save(BIST_LAST_GOOD_KEY, trStocks, BIST_LAST_GOOD_TTL_MINUTES);
        } else {
            List<StockDto> fallback = cacheService.get(BIST_LAST_GOOD_KEY);
            if (!fallback.isEmpty()) {
                log.info("[BIST_STOCK] Canlı fetch boş, last-good snapshot kullanılıyor: {} sembol", fallback.size());
                allStocks.addAll(fallback);
            }
        }

        List<MarketAssetDto> globalRaw = yahooFinanceClient.fetchQuotes(GLOBAL_STOCK_SYMBOLS, "HİSSE SENEDİ (YABANCI)");
        if (globalRaw != null) {
            allStocks.addAll(globalRaw.stream().map(this::mapToStockDto).toList());
        }
        return allStocks;
    }

    @Scheduled(fixedRate = 300000)
    public void syncStocks() {
        List<StockDto> list = fetchAndCombineStocks();
        if (!list.isEmpty()) cacheService.save("cache:stocks", list, 5);
    }

    @Scheduled(fixedRate = 300000)
    public void syncIndices() {
        getIndices(); // Cache'i tetikler ve günceller
    }

    private StockDto mapToStockDto(MarketAssetDto m) {
        StockDto s = new StockDto();
        s.setSymbol(m.getSymbol()); s.setName(m.getName()); s.setAssetType(m.getAssetType());
        s.setPrice(m.getPrice()); s.setBuyPrice(m.getBuyPrice()); s.setChangePercent(m.getChangePercent());
        s.setVolume(m.getVolume()); s.setYahooSymbol(m.getYahooSymbol()); s.setChartType(m.getChartType());
        s.setAssetCategory(m.getAssetCategory());
        return s;
    }
}