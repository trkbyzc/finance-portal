package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.domains.turkish_bond.service.TurkishBondService;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class TurkishBondChartStrategy implements ChartDataStrategy {

    private final TurkishBondService turkishBondService;

    @Override
    public boolean supports(String category, String symbol) {
        // 🚀 İKİLİ KONTROL:
        // 1. Eğer açıkça TR_BOND dediyse direkt al.
        // 2. Eğer genel BOND dediyse, bir de sembole bak: TP. ile başlıyorsa bu kesin Türk tahvilidir, bunu da al!
        boolean isMatch = "TR_BOND".equalsIgnoreCase(category) ||
                ("BOND".equalsIgnoreCase(category) && symbol != null && symbol.startsWith("TP."));

        if (isMatch) {
            log.info("[CHART STRATEGY] TurkishBondChartStrategy yakaladı: Category={}, Symbol={}", category, symbol);
        }

        return isMatch;
    }

    @Override
    public List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval, String startDate, String endDate) {
        log.info("[CHART STRATEGY] Türk Tahvilleri grafiği çekiliyor: {}", symbol);
        return turkishBondService.fetchBondHistoryFromRedis(symbol != null ? symbol.trim() : "");
    }
}