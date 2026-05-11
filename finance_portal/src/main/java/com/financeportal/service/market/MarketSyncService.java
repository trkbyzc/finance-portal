package com.financeportal.service.market.MarketDataService;

import com.financeportal.client.*;
import com.financeportal.model.dto.market.CurrencyRateDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketSyncService {

    private final CoinGeckoClient coinGeckoClient;
    private final MarketDataScraperClient marketDataScraperClient;
    private final YahooFinanceClient yahooFinanceClient;
    private final TcmbIntegrationClient tcmbIntegrationClient;
    private final FintablesIntegrationClient fintablesIntegrationClient;
    private final TruncgilIntegrationClient truncgilIntegrationClient;
    private final CacheService cacheService;

    private final String[] GLOBAL_STOCK_SYMBOLS = { "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "NFLX", "AMD", "INTC", "BABA", "JPM", "V", "WMT", "JNJ", "PG", "MA", "HD" };
    private final List<String> GLOBAL_ETF_SYMBOLS = List.of("SPY", "GLD", "TLT", "VNQ", "DIA", "IWM", "VTI", "VOO", "HYG", "LQD", "BND", "AGG", "IEF", "SHY");

    @Scheduled(fixedRate = 3600000)
    public void fetchAndCacheCurrencyRates() {
        long startTime = System.currentTimeMillis();
        List<CurrencyRateDto> rates = tcmbIntegrationClient.fetchTcmbCurrencyRates();
        if (rates != null && !rates.isEmpty()) {
            cacheService.save("cache:currencies", rates, 60);
            log.info("[CURRENCY] Successfully updated {} currency rates from TCMB/EVDS in {} ms.", rates.size(), (System.currentTimeMillis() - startTime));
        } else log.warn("[CURRENCY] Failed to update currency rates.");
    }

    @Scheduled(fixedRate = 300000)
    public void fetchCryptoRates() {
        long startTime = System.currentTimeMillis();
        List<CurrencyRateDto> rates = coinGeckoClient.fetchCryptoRates();
        if (rates != null && !rates.isEmpty()) {
            cacheService.save("cache:crypto", rates, 5);
            log.info("[CRYPTO] Successfully updated {} cryptocurrencies from CoinGecko in {} ms.", rates.size(), (System.currentTimeMillis() - startTime));
        } else log.warn("[CRYPTO] Failed to update cryptocurrency rates.");
    }

    @Scheduled(fixedRate = 300000)
    public void fetchStocks() {
        long startTime = System.currentTimeMillis();
        List<MarketAssetDto> allStocks = new ArrayList<>();
        List<MarketAssetDto> trStocks = fintablesIntegrationClient.fetchTurkishStocks();
        if (trStocks != null) allStocks.addAll(trStocks);
        List<MarketAssetDto> globalStocks = yahooFinanceClient.fetchFromYahooAPI(GLOBAL_STOCK_SYMBOLS, "HİSSE SENEDİ (YABANCI)");
        if (globalStocks != null) allStocks.addAll(globalStocks);
        if (!allStocks.isEmpty()) {
            cacheService.save("cache:stocks", allStocks, 5);
            log.info("[STOCKS] Successfully updated {} stocks in {} ms.", allStocks.size(), (System.currentTimeMillis() - startTime));
        } else log.warn("[STOCKS] Failed to update stock data.");
    }

    @Scheduled(fixedRate = 300000)
    public void fetchIndices() {
        long startTime = System.currentTimeMillis();
        List<MarketAssetDto> list = yahooFinanceClient.fetchFromYahooAPI(new String[]{"XU100.IS", "XU030.IS", "XBANK.IS", "XUSIN.IS"}, "ENDEKS");
        if (list != null && !list.isEmpty()) {
            cacheService.save("cache:indices", list, 5);
            log.info("[INDEX] Successfully updated {} indices in {} ms.", list.size(), (System.currentTimeMillis() - startTime));
        } else log.warn("[INDEX] Failed to update index data.");
    }

    @Scheduled(fixedRate = 3600000)
    public void fetchBonds() {
        long startTime = System.currentTimeMillis();
        String[] bondSymbols = {"^TNX", "^IRX", "^TYX", "^FVX", "TLT", "IEF", "SHY", "BND", "AGG", "LQD", "HYG"};
        List<MarketAssetDto> list = yahooFinanceClient.fetchFromYahooAPI(bondSymbols, "TAHVİL / BONO");
        if (list != null && !list.isEmpty()) {
            cacheService.save("cache:bonds", list, 60);
            log.info("[BONDS] Successfully updated {} global bonds in {} ms.", list.size(), (System.currentTimeMillis() - startTime));
        } else log.warn("[BONDS] Failed to update global bond data.");
    }

    @Scheduled(fixedRate = 300000)
    public void fetchViopData() {
        long startTime = System.currentTimeMillis();
        List<MarketAssetDto> list = marketDataScraperClient.scrapeViopData();
        if (list != null && !list.isEmpty()) {
            cacheService.save("cache:viop", list, 5);
            log.info("[VIOP] Successfully updated {} VIOP contracts in {} ms.", list.size(), (System.currentTimeMillis() - startTime));
        } else log.warn("[VIOP] Failed to update VIOP data.");
    }

    @Scheduled(fixedRate = 300000)
    public void fetchFutures() {
        long startTime = System.currentTimeMillis();
        List<MarketAssetDto> list = yahooFinanceClient.fetchFromYahooAPI(new String[]{"ES=F", "NQ=F", "GC=F", "CL=F"}, "VIOP / VADELİ İŞLEM");
        if (list != null && !list.isEmpty()) {
            cacheService.save("cache:futures", list, 5);
            log.info("[FUTURES] Successfully updated {} global futures in {} ms.", list.size(), (System.currentTimeMillis() - startTime));
        } else log.warn("[FUTURES] Failed to update global futures data.");
    }

    @Scheduled(fixedRate = 300000)
    public void fetchCommodities() {
        long startTime = System.currentTimeMillis();
        String[] commoditySymbols = {"GC=F", "SI=F", "PL=F", "PA=F", "CL=F", "BZ=F", "NG=F", "HG=F", "ZW=F", "ZC=F", "KC=F", "CC=F", "CT=F"};
        List<MarketAssetDto> list = yahooFinanceClient.fetchFromYahooAPI(commoditySymbols, "EMTİA");
        if (list != null && !list.isEmpty()) {
            cacheService.save("cache:commodities", list, 5);
            log.info("[COMMODITIES] Successfully updated {} commodities in {} ms.", list.size(), (System.currentTimeMillis() - startTime));
        } else log.warn("[COMMODITIES] Failed to update commodity data.");
    }

    @Scheduled(fixedRate = 3600000)
    public void fetchGlobalFunds() {
        long startTime = System.currentTimeMillis();
        List<MarketAssetDto> list = yahooFinanceClient.fetchFromYahooAPI(GLOBAL_ETF_SYMBOLS.toArray(new String[0]), "YATIRIM FONU (GLOBAL)");
        if (list != null && !list.isEmpty()) {
            cacheService.save("cache:global_funds", list, 60);
            log.info("[GLOBAL_FUNDS] Successfully updated {} global ETFs in {} ms.", list.size(), (System.currentTimeMillis() - startTime));
        } else log.warn("[GLOBAL_FUNDS] Failed to update global ETF data.");
    }

    @Scheduled(fixedRate = 3600000)
    public void fetchTrFunds() {
        long startTime = System.currentTimeMillis();
        List<MarketAssetDto> list = fintablesIntegrationClient.fetchTefasFunds();
        if (list != null && !list.isEmpty()) {
            cacheService.save("cache:tr_funds", list, 60);
            log.info("[TR_FUNDS] Successfully updated {} Turkish funds in {} ms.", list.size(), (System.currentTimeMillis() - startTime));
        } else log.warn("[TR_FUNDS] Failed to update Turkish fund data.");
    }

    @Scheduled(fixedRate = 300000)
    public void fetchTurkishGoldData() {
        long startTime = System.currentTimeMillis();
        List<MarketAssetDto> goldList = truncgilIntegrationClient.fetchLiveTurkishGold();

        // 🚀 FALLBACK MANTIĞI BURADA DA KORUNDU
        if (goldList == null || goldList.isEmpty()) {
            log.info("[GOLD] Live data unavailable. Mathematical fallback will be used on query.");
            return;
        }
        cacheService.save("cache:turkish_gold", goldList, 5);
        log.info("[GOLD] Successfully updated {} Turkish gold variants in {} ms.", goldList.size(), (System.currentTimeMillis() - startTime));
    }

    @Scheduled(fixedRate = 3600000)
    public void fetchIPOs() {
        long startTime = System.currentTimeMillis();
        List<Map<String, Object>> ipos = marketDataScraperClient.scrapeIPOCalendar();
        if (ipos != null && !ipos.isEmpty()) {
            cacheService.save("cache:ipos", ipos, 60);
            log.info("[IPO] Successfully updated IPO calendar ({} records) in {} ms.", ipos.size(), (System.currentTimeMillis() - startTime));
        } else log.warn("[IPO] No active IPOs found.");
    }
}