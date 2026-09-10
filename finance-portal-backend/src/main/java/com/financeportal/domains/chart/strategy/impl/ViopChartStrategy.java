package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.domains.viop.client.ViopScraperClient;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(1) // Strategy chain'de ilk sıraya alındı; VIOP sembollerini diğer stratejiler denemeden yakalar
@RequiredArgsConstructor
@Slf4j
public class ViopChartStrategy implements ChartDataStrategy {

    private final ViopScraperClient viopScraperClient;

    @Override
    public boolean supports(String category, String symbol) {
        boolean isMatch = "VIOP".equalsIgnoreCase(category);

        if (isMatch) {
            log.info("[CHART STRATEGY] ViopChartStrategy sembolü yakaladı: {}", symbol);
        }

        return isMatch;
    }

    @Override
    public List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval, String startDate, String endDate) {
        log.info("[CHART STRATEGY] VİOP grafiği çekiliyor: {}", symbol);
        return viopScraperClient.fetchViopHistoryFromIsYatirim(symbol != null ? symbol.trim() : "", range);
    }
}