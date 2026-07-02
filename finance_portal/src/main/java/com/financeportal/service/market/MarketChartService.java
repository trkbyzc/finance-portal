package com.financeportal.service.market;

import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.service.cache.CacheService;
import com.financeportal.service.mapper.ChartMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.AnnotationAwareOrderComparator;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@Slf4j
public class MarketChartService {

    private final List<ChartDataStrategy> chartStrategies;
    private final CacheService cacheService;
    private final ChartMapper chartMapper;

    @Autowired
    public MarketChartService(List<ChartDataStrategy> strategies, CacheService cacheService, ChartMapper chartMapper) {
        this.chartStrategies = strategies.stream()
                .sorted(AnnotationAwareOrderComparator.INSTANCE)
                .toList();

        this.cacheService = cacheService;
        this.chartMapper = chartMapper;
        log.info("[CHART DEBUG] Stratejiler sıralandı. Liste boyutu: {}", this.chartStrategies.size());
    }

    public List<HistoricalDataDto> getHistoricalDataWithEvdsFallback(
            String symbol, String category, String range, String interval, String startDate, String endDate, int maPeriod) {

        String cleanSymbol = (symbol != null) ? symbol.trim().toUpperCase(Locale.forLanguageTag("tr-TR")) : "";
        String safeCategory = (category != null) ? category.trim().toUpperCase() : "UNKNOWN";

        log.info("[DEBUG] Gelen Sembol: '{}', Kategori: '{}'", cleanSymbol, safeCategory);

        String cacheKey = "hist:" + safeCategory + ":" + cleanSymbol + ":" + range;
        // Custom (özel tarih) aralığında startDate/endDate cache key'e girmeli — aksi halde
        // tüm farklı tarih aralıkları aynı "...:custom" anahtarını paylaşıp yanlış veri döner.
        if ("custom".equalsIgnoreCase(range)) {
            cacheKey += ":" + startDate + ":" + endDate;
        }

        return cacheService.getOrFetch(cacheKey, () -> {
            List<HistoricalDataDto> dataList = new ArrayList<>();
            boolean found = false;

            for (ChartDataStrategy strategy : chartStrategies) {
                if (strategy.supports(safeCategory, cleanSymbol)) {
                    log.info("[DEBUG] Sembol '{}' (Kategori: '{}') için '{}' stratejisi devreye girdi.",
                            cleanSymbol, safeCategory, strategy.getClass().getSimpleName());
                    dataList = strategy.fetchHistoricalData(symbol, range, interval, startDate, endDate);
                    found = true;
                    break;
                }
            }

            if (!found) {
                log.error("[DEBUG] Hiçbir strateji bulunamadı! Sembol: '{}', Kategori: '{}'", cleanSymbol, safeCategory);
            }

            if (dataList == null) dataList = new ArrayList<>();
            if (!dataList.isEmpty() && maPeriod > 0) dataList = chartMapper.calculateMovingAverage(dataList, maPeriod);

            return dataList;
        }, 5);
    }
}