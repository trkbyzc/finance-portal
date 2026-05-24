package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.domains.fund.client.TefasFundClient;
import com.financeportal.domains.fund.service.FundService;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(5) // 🚀 Döviz kurlarından (Order 2) sonra çalışacak
@RequiredArgsConstructor
@Slf4j
public class FundChartStrategy implements ChartDataStrategy {

    private final TefasFundClient tefasFundClient;
    private final FundService fundService; // İlerde başka işlemlerde lazım olursa diye korundu

    @Override
    public boolean supports(String category, String symbol) {
        // 🚀 AĞIR DÖNGÜ SİLİNDİ! Artık sadece kategoriye bakıyoruz.
        boolean isMatch = "TR_FUND".equalsIgnoreCase(category);

        if (isMatch) {
            log.info("[CHART STRATEGY] FundChartStrategy sembolü yakaladı: {}", symbol);
        }

        return isMatch;
    }

    @Override
    public List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval, String startDate, String endDate) {
        log.info("[CHART STRATEGY] TEFAS Fon grafiği çekiliyor: {}", symbol);
        // API'ye gönderirken orijinal sembolü trim'leyip gönderiyoruz
        return tefasFundClient.fetchFundHistory(symbol != null ? symbol.trim() : "", range);
    }
}