package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.client.yahoo.YahooChartClient;
import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(9999) // Catch-all fallback: diğer tüm stratejilerden sonra çalışır; özel kuralı olmayan semboller buraya düşer.
@RequiredArgsConstructor
@Slf4j
public class YahooDefaultChartStrategy implements ChartDataStrategy {

    private final YahooChartClient yahooChartClient;

    @Override
    public boolean supports(String category, String symbol) {
        // En sona kaldığı için, özel bir kuralı olmayan (ABD Hisse, Kripto, Emtia) her şeyi kabul eder.
        return true;
    }

    @Override
    public List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval, String startDate, String endDate) {
        String clean = (symbol != null) ? symbol.trim().toUpperCase() : "UNKNOWN";
        log.info("[CHART STRATEGY] Yahoo Default grafiği çekiliyor. Gelen Saf Sembol: {}", clean);

        // Sembol herhangi bir dönüşüm yapılmadan (AAPL, PEPE-USD, GC=F) Yahoo'ya doğrudan iletilir.
        return yahooChartClient.fetchChartHistory(clean, range, interval, startDate, endDate);
    }
}