package com.financeportal.domains.chart.strategy.impl;

import com.financeportal.domains.chart.strategy.ChartDataStrategy;
import com.financeportal.domains.effective_currency.service.EffectiveCurrencyService;
import com.financeportal.model.dto.market.HistoricalDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * "EFFECTIVE_CURRENCY" kategorisi için chart historical kaynağı.
 * Currency'nin paralel kopyası — sadece data Redis'in `evds:effective-currency:{CCY}` prefix'inden gelir.
 */
@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class EffectiveCurrencyChartStrategy implements ChartDataStrategy {

    private final EffectiveCurrencyService effectiveCurrencyService;

    @Override
    public boolean supports(String category, String symbol) {
        return "EFFECTIVE_CURRENCY".equalsIgnoreCase(category);
    }

    @Override
    public List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval, String startDate, String endDate) {
        String clean = symbol == null ? "" : symbol.trim().toUpperCase()
                .replace("TRY=X", "")
                .replace("=X", "");
        log.info("[CHART STRATEGY] Efektif döviz grafiği EVDS Redis'ten: {}", clean);
        return effectiveCurrencyService.getEffectiveCurrencyHistoryAsDto(clean, range);
    }
}
