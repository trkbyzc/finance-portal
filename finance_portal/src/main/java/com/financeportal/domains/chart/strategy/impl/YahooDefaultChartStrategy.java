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
@Order(9999) // 🚀 KESİNLİKLE EN SON ÇALIŞACAK! Diğer özel kurallardan kaçanlar buraya düşer.
@RequiredArgsConstructor
@Slf4j
public class YahooDefaultChartStrategy implements ChartDataStrategy {

    // 🚀 DİKKAT: YahooSymbolResolver'ı BURADAN SİLDİK! Artık tahmin/varsayım yok.
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

        // 🚀 Frontend'den nasıl geldiyse (AAPL, PEPE-USD, GC=F) DOĞRUDAN Yahoo'ya gidiyor!
        return yahooChartClient.fetchChartHistory(clean, range, interval, startDate, endDate);
    }
}