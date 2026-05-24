package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.domains.stock.client.BistStockClient;
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
public class BistIndexChartStrategy implements ChartDataStrategy {

    private final BistStockClient bistStockClient;

    @Override
    public boolean supports(String category, String symbol) {
        // 🚀 Artık isim listesinde aramıyoruz! Frontend "TR_INDEX" dediyse olay bitmiştir.
        return "TR_INDEX".equalsIgnoreCase(category);
    }

    @Override
    public List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval, String startDate, String endDate) {
        // İhtimal dahilinde frontend .IS gönderirse diye temizliyoruz
        String cleanSymbol = symbol.trim().toUpperCase().replace(".IS", "");

        log.info("[CHART STRATEGY] BIST Endeks grafiği kendi client'ımızdan çekiliyor: {}", cleanSymbol);

        // 🚀 Yahoo'ya DEĞİL, senin yazdığın BistStockClient'a gidiyor!
        return bistStockClient.fetchIndexHistory(cleanSymbol, range);
    }
}