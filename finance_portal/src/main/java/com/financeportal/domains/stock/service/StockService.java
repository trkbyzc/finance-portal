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

    private final String[] GLOBAL_STOCK_SYMBOLS = { "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "NFLX", "AMD", "INTC", "BABA", "JPM", "V", "WMT", "JNJ", "PG", "MA", "HD" };

    public List<StockDto> getStocks() {
        return cacheService.getOrFetch("cache:stocks", this::fetchAndCombineStocks, 5);
    }

    public List<StockDto> getIndices() {
        return cacheService.getOrFetch("cache:indices", () -> {
            List<MarketAssetDto> raw = yahooFinanceClient.fetchQuotes(new String[]{"XU100.IS", "XU030.IS", "XU050.IS", "XBANK.IS", "XUSIN.IS"}, "ENDEKS");
            return raw.stream().map(this::mapToStockDto).toList();
        }, 5);
    }

    private List<StockDto> fetchAndCombineStocks() {
        List<StockDto> allStocks = new ArrayList<>();
        List<StockDto> trStocks = bistStockClient.fetchTurkishStocks();
        if (trStocks != null) allStocks.addAll(trStocks);

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