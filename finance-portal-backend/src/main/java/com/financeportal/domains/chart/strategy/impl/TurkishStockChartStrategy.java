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
@Order(4)
@RequiredArgsConstructor
@Slf4j
public class TurkishStockChartStrategy implements ChartDataStrategy {

    private final YahooChartClient yahooChartClient;

    @Override
    public boolean supports(String category, String symbol) {
        // Sadece frontend'den TR_STOCK kategorisi gelirse çalışır (Fintables hisseleri)
        return "TR_STOCK".equalsIgnoreCase(category);
    }

    @Override
    public List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval, String startDate, String endDate) {
        String cleanSymbol = symbol.trim().toUpperCase();

        // Fintables'tan "THYAO" gelir, biz Yahoo'dan çizebilmek için sonuna .IS ekleriz.
        String yahooSymbol = cleanSymbol.endsWith(".IS") ? cleanSymbol : cleanSymbol + ".IS";

        log.info("[CHART STRATEGY] Türk Hisse grafiği çekiliyor: {}", yahooSymbol);
        return yahooChartClient.fetchChartHistory(yahooSymbol, range, interval, startDate, endDate);
    }
}