package com.financeportal.domains.chart.strategy;

import com.financeportal.model.dto.market.HistoricalDataDto;
import java.util.List;

public interface ChartDataStrategy {

    boolean supports(String category, String symbol);

    List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval, String startDate, String endDate);

}