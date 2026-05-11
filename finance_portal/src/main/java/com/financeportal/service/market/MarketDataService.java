package com.financeportal.service.market;

import com.financeportal.client.*;
import com.financeportal.model.dto.market.CurrencyRateDto;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import com.financeportal.service.mapper.BondMapper;
import com.financeportal.service.mapper.CurrencyRateMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketDataService {

    private final CoinGeckoClient coinGeckoClient;
    private final MarketDataScraperClient marketDataScraperClient;
    private final YahooFinanceClient yahooFinanceClient;
    private final TcmbIntegrationClient tcmbIntegrationClient;
    private final FintablesIntegrationClient fintablesIntegrationClient;
    private final TruncgilIntegrationClient truncgilIntegrationClient;
    private final CacheService cacheService;
    private final CurrencyRateMapper currencyRateMapper;
    private final BondMapper bondMapper;

    // 🚀 Yeni eklediğimiz Chart Servisimiz
    private final MarketChartService marketChartService;

    private final List<String> GLOBAL_ETF_SYMBOLS = List.of("SPY", "GLD", "TLT", "VNQ", "DIA", "IWM", "VTI", "VOO", "HYG", "LQD", "BND", "AGG", "IEF", "SHY");
    private final String[] GLOBAL_STOCK_SYMBOLS = { "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "NFLX", "AMD", "INTC", "BABA", "JPM", "V", "WMT", "JNJ", "PG", "MA", "HD" };
    private final String[] COMMODITY_SYMBOLS = { "GC=F", "SI=F", "PL=F", "PA=F", "CL=F", "BZ=F", "NG=F", "HG=F", "ZW=F", "ZC=F", "KC=F", "CC=F", "CT=F" };

    public List<CurrencyRateDto> getCurrencyRates() {
        return cacheService.getOrFetch("cache:currencies", tcmbIntegrationClient::fetchTcmbCurrencyRates, 60);
    }

    public List<CurrencyRateDto> simulateBankRates() {
        return currencyRateMapper.applyBankSpreads(getCurrencyRates());
    }

    public List<CurrencyRateDto> getCryptoRates() {
        return cacheService.getOrFetch("cache:crypto", coinGeckoClient::fetchCryptoRates, 5);
    }

    public List<MarketAssetDto> getStocks() {
        return cacheService.getOrFetch("cache:stocks", () -> {
            List<MarketAssetDto> allStocks = new ArrayList<>();
            List<MarketAssetDto> trStocks = fintablesIntegrationClient.fetchTurkishStocks();
            if (trStocks != null) allStocks.addAll(trStocks);
            List<MarketAssetDto> globalStocks = yahooFinanceClient.fetchFromYahooAPI(GLOBAL_STOCK_SYMBOLS, "HİSSE SENEDİ (YABANCI)");
            if (globalStocks != null) allStocks.addAll(globalStocks);
            return allStocks;
        }, 5);
    }

    public List<MarketAssetDto> getIndices() {
        return cacheService.getOrFetch("cache:indices", () -> yahooFinanceClient.fetchFromYahooAPI(new String[]{"XU100.IS", "XU030.IS", "XBANK.IS", "XUSIN.IS"}, "ENDEKS"), 5);
    }

    public List<MarketAssetDto> getBonds() {
        return cacheService.getOrFetch("cache:bonds", () -> yahooFinanceClient.fetchFromYahooAPI(new String[]{"^TNX", "^IRX", "^TYX", "^FVX", "TLT", "IEF", "SHY", "BND", "AGG", "LQD", "HYG"}, "TAHVİL / BONO"), 60);
    }

    public List<MarketAssetDto> getViopData() {
        return cacheService.getOrFetch("cache:viop", marketDataScraperClient::scrapeViopData, 5);
    }

    public List<MarketAssetDto> getFutures() {
        return cacheService.getOrFetch("cache:futures", () -> yahooFinanceClient.fetchFromYahooAPI(new String[]{"ES=F", "NQ=F", "GC=F", "CL=F"}, "VIOP / VADELİ İŞLEM"), 5);
    }

    public List<MarketAssetDto> getCommodities() {
        return cacheService.getOrFetch("cache:commodities", () -> yahooFinanceClient.fetchFromYahooAPI(COMMODITY_SYMBOLS, "EMTİA"), 5);
    }

    public List<MarketAssetDto> getGlobalFunds() {
        return cacheService.getOrFetch("cache:global_funds", () -> yahooFinanceClient.fetchFromYahooAPI(GLOBAL_ETF_SYMBOLS.toArray(new String[0]), "YATIRIM FONU (GLOBAL)"), 60);
    }

    public List<MarketAssetDto> getTrFunds() {
        return cacheService.getOrFetch("cache:tr_funds", fintablesIntegrationClient::fetchTefasFunds, 60);
    }

    public List<Map<String, Object>> getTurkishBonds() {
        List<Map<String, Object>> yieldCurve = bondMapper.getBondYieldCurve();
        return yieldCurve.isEmpty() ? bondMapper.getFallbackYieldCurve() : yieldCurve;
    }

    // 🚀 HESAPLAMA MANTIĞI BURADA KORUNDU
    public List<MarketAssetDto> getTurkishGold() {
        return cacheService.getOrFetch("cache:turkish_gold", () -> {
            List<MarketAssetDto> list = truncgilIntegrationClient.fetchLiveTurkishGold();
            return (list != null && !list.isEmpty()) ? list : calculateGoldMathematically();
        }, 5);
    }

    private List<MarketAssetDto> calculateGoldMathematically() {
        List<MarketAssetDto> goldList = new ArrayList<>();
        try {
            List<MarketAssetDto> commodities = getCommodities();
            List<CurrencyRateDto> currencies = getCurrencyRates();
            if (commodities == null || currencies == null || commodities.isEmpty() || currencies.isEmpty()) return goldList;

            MarketAssetDto ons = commodities.stream().filter(c -> "GC=F".equals(c.getSymbol())).findFirst().orElse(null);
            CurrencyRateDto usd = currencies.stream().filter(c -> "USD".equals(c.getCurrencyCode())).findFirst().orElse(null);

            if (ons == null || usd == null || ons.getPrice() == null || usd.getForexSelling() == null) return goldList;

            BigDecimal gramPrice = ons.getPrice().divide(new BigDecimal("31.1034768"), 6, RoundingMode.HALF_UP).multiply(usd.getForexSelling());
            BigDecimal changePct = ons.getChangePercent() != null ? ons.getChangePercent() : BigDecimal.ZERO;

            goldList.add(createGoldDto("GRAM_ALTIN", "Gram Altın (Yedek)", gramPrice, new BigDecimal("1"), changePct));
            goldList.add(createGoldDto("CEYREK_ALTIN", "Çeyrek Altın (Yedek)", gramPrice, new BigDecimal("1.64"), changePct));
            goldList.add(createGoldDto("TAM_ALTIN", "Tam Altın (Yedek)", gramPrice, new BigDecimal("6.56"), changePct));
            goldList.add(createGoldDto("CUMHURIYET_ALTINI", "Cumhuriyet Altını (Yedek)", gramPrice, new BigDecimal("6.60"), changePct));
        } catch (Exception e) {
            log.error("[GOLD_MATH] Error during fallback: {}", e.getMessage());
        }
        return goldList;
    }

    private MarketAssetDto createGoldDto(String symbol, String name, BigDecimal gramPrice, BigDecimal multiplier, BigDecimal changePct) {
        MarketAssetDto dto = new MarketAssetDto();
        dto.setSymbol(symbol); dto.setName(name); dto.setAssetType("TÜRK ALTINI"); dto.setAssetCategory("COMMODITY"); dto.setChartType("LINE"); dto.setYahooSymbol("GC=F");
        BigDecimal sellPrice = gramPrice.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        dto.setPrice(sellPrice);
        BigDecimal spread = symbol.contains("GRAM") ? new BigDecimal("0.998") : new BigDecimal("0.985");
        dto.setBuyPrice(sellPrice.multiply(spread).setScale(2, RoundingMode.HALF_UP));
        dto.setChangePercent(changePct); dto.setVolume(0L);
        return dto;
    }

    public List<Map<String, Object>> getIPOCalendar() {
        return cacheService.getOrFetch("cache:ipos", marketDataScraperClient::scrapeIPOCalendar, 60);
    }

    public Map<String, Object> getEconomyData() {
        return Map.of("inflation", 67.03, "interestRate", 50.00, "gdpGrowth", 4.5, "unemployment", 8.7);
    }

    public List<Map<String, Object>> getEconomyHistory(String metric, String range) {
        return tcmbIntegrationClient.fetchEconomyDataWithFallback(metric, range);
    }

    // 🚀 KÖPRÜ: Controller'dan gelen çağrıyı yeni Chart Servisine yolluyoruz
    public List<HistoricalDataDto> getHistoricalDataWithEvdsFallback(String symbol, String range, String interval, String startDate, String endDate, int maPeriod) {
        return marketChartService.getHistoricalDataWithEvdsFallback(symbol, range, interval, startDate, endDate, maPeriod, getTrFunds());
    }
}