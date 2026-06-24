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
        // Kategori bazlı yönlendirme: sembol listesi yerine "TR_INDEX" category etiketiyle dispatch ediliyor.
        return "TR_INDEX".equalsIgnoreCase(category);
    }

    @Override
    public List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval, String startDate, String endDate) {
        // İhtimal dahilinde frontend .IS gönderirse diye temizliyoruz
        String cleanSymbol = symbol.trim().toUpperCase().replace(".IS", "");

        log.info("[CHART STRATEGY] BIST Endeks grafiği kendi client'ımızdan çekiliyor: {}", cleanSymbol);

        return bistStockClient.fetchIndexHistory(cleanSymbol, range);
    }
}