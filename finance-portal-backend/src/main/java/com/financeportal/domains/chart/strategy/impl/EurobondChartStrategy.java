package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.domains.eurobond.client.BusinessInsiderBondClient;
import com.financeportal.domains.eurobond.service.EurobondService;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * EUROBOND kategorisi grafiği — sembol (ISIN) businessinsider tkData'sına çözülür ve
 * Chart_GetChartData üzerinden temiz fiyat serisi (area chart) çekilir.
 *
 * isin→tkData eşlemesi {@link EurobondService}'in cache'lediği listeden gelir.
 * Bu strateji olmadan EUROBOND, YahooDefaultChartStrategy'ye düşerdi (eski EMB proxy davranışı).
 */
@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class EurobondChartStrategy implements ChartDataStrategy {

    private final EurobondService eurobondService;
    private final BusinessInsiderBondClient client;

    @Override
    public boolean supports(String category, String symbol) {
        return "EUROBOND".equalsIgnoreCase(category);
    }

    @Override
    public List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval,
                                                       String startDate, String endDate) {
        String tkData = eurobondService.resolveTkData(symbol);
        if (tkData == null) {
            log.warn("[EUROBOND-CHART] '{}' için tkData bulunamadı (katalog dışı?).", symbol);
            return Collections.emptyList();
        }
        log.info("[EUROBOND-CHART] {} → tkData={} ({})", symbol, tkData, range);
        return client.fetchChart(tkData, range);
    }
}
