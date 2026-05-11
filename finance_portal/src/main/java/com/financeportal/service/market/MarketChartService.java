package com.financeportal.service.market;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.client.FintablesIntegrationClient;
import com.financeportal.client.MarketDataScraperClient;
import com.financeportal.client.TcmbIntegrationClient;
import com.financeportal.client.YahooFinanceClient;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.model.dto.market.MarketAssetDto;
import com.financeportal.service.cache.CacheService;
import com.financeportal.service.mapper.ChartMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketChartService {

    private final YahooFinanceClient yahooFinanceClient;
    private final TcmbIntegrationClient tcmbIntegrationClient;
    private final FintablesIntegrationClient fintablesIntegrationClient;
    private final MarketDataScraperClient marketDataScraperClient;
    private final CacheService cacheService;
    private final ChartMapper chartMapper;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    private final List<String> GLOBAL_ETF_SYMBOLS = List.of("SPY", "GLD", "TLT", "VNQ", "DIA", "IWM", "VTI", "VOO", "HYG", "LQD", "BND", "AGG", "IEF", "SHY");

    // 🚀 CONTROLLER'DAN KURTARDIĞIMIZ EVDS/REDIS MANTIĞI BURAYA GELDİ
    public List<HistoricalDataDto> getHistoricalDataWithEvdsFallback(
            String symbol, String range, String interval, String startDate, String endDate, int maPeriod, List<MarketAssetDto> trFunds) {

        if (symbol != null && symbol.startsWith("TP.")) {
            try {
                String jsonStr = stringRedisTemplate.opsForValue().get("evds:history:" + symbol);
                if (jsonStr != null && !jsonStr.isBlank()) {
                    log.info("📊 EVDS Geçmiş Verisi Redis'ten Alındı: {}", symbol);
                    return objectMapper.readValue(jsonStr, new TypeReference<>() {});
                }
            } catch (Exception e) {
                log.error("⚠️ EVDS Geçmiş verisi parse edilemedi: {}", e.getMessage());
            }
        }
        return getRealHistoricalData(symbol, range, interval, startDate, endDate, maPeriod, trFunds);
    }

    private List<HistoricalDataDto> getRealHistoricalData(String symbol, String range, String interval, String startDate, String endDate, int maPeriod, List<MarketAssetDto> trFunds) {
        String activeInterval = ("1d".equalsIgnoreCase(range)) ? "15m" : interval;
        String cacheKey = String.format("hist_clean:%s:%s:%s", symbol, range, activeInterval);

        String cleanSymbol = (symbol != null) ? symbol.toUpperCase(Locale.forLanguageTag("tr-TR")) : "";
        boolean isGlobalFund = GLOBAL_ETF_SYMBOLS.contains(cleanSymbol);

        return cacheService.getOrFetch(cacheKey, () -> {
            List<HistoricalDataDto> dataList = new ArrayList<>();
            try {
                boolean isViop = cleanSymbol.contains("VADE") || cleanSymbol.startsWith("F_");
                boolean isTrBond = cleanSymbol.startsWith("TP.");
                boolean isTefasFund = isSymbolInCacheSafe(trFunds, cleanSymbol);
                boolean isCurrency = cleanSymbol.length() == 3 || cleanSymbol.endsWith("TRY=X");

                if (isViop) {
                    dataList = marketDataScraperClient.fetchViopHistoryFromIsYatirim(symbol, range);
                } else if (isTrBond) {
                    dataList = tcmbIntegrationClient.fetchBondHistoryFromRedis(symbol, range);
                } else if (isGlobalFund) {
                    dataList = yahooFinanceClient.fetchYahooChartCore(symbol, range, interval, startDate, endDate);
                } else if (isTefasFund) {
                    dataList = fintablesIntegrationClient.fetchFundHistory(symbol, range);
                } else if (isCurrency) {
                    dataList = tcmbIntegrationClient.fetchCurrencyHistoryFromRedis(cleanSymbol, range);
                } else {
                    String yahooSymbol = yahooFinanceClient.resolveYahooSymbol(symbol);
                    dataList = yahooFinanceClient.fetchYahooChartCore(yahooSymbol, range, interval, startDate, endDate);
                }
            } catch (Exception e) {
                log.error("[CHART] System error while fetching historical data for symbol: {}. Error: {}", symbol, e.getMessage());
            }

            if (dataList == null) dataList = new ArrayList<>();

            if (!dataList.isEmpty() && cleanSymbol.contains("JPY")) {
                for (HistoricalDataDto d : dataList) {
                    if (d.getOpen() != null) d.setOpen(d.getOpen().multiply(new BigDecimal("100")));
                    if (d.getHigh() != null) d.setHigh(d.getHigh().multiply(new BigDecimal("100")));
                    if (d.getLow() != null) d.setLow(d.getLow().multiply(new BigDecimal("100")));
                    if (d.getClose() != null) d.setClose(d.getClose().multiply(new BigDecimal("100")));
                }
            }

            if (!dataList.isEmpty() && maPeriod > 0) {
                dataList = chartMapper.calculateMovingAverage(dataList, maPeriod);
            }
            return dataList;
        }, 5);
    }

    private boolean isSymbolInCacheSafe(List<?> cacheList, String targetSymbol) {
        if (cacheList == null || targetSymbol == null) return false;
        for (Object item : cacheList) {
            if (item instanceof MarketAssetDto && targetSymbol.equals(((MarketAssetDto) item).getSymbol())) return true;
            else if (item instanceof Map) {
                Object symObj = ((Map<?, ?>) item).get("symbol");
                if (symObj != null && targetSymbol.equals(symObj.toString().toUpperCase(Locale.ENGLISH))) return true;
            }
        }
        return false;
    }
}