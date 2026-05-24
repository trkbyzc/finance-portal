package com.financeportal.domains.chart.strategy;

import com.financeportal.model.dto.market.HistoricalDataDto;
import java.util.List;

public interface ChartDataStrategy {

    // 🚀 DÜZELTME 2: Artık sadece sembolü değil, KATEGORİYİ de soruyoruz!
    boolean supports(String category, String symbol);

    // Ana veri çekme metodu (İlerde buraya da category eklenebilir ama şu anlık ihtiyaç yok, strategy zaten ne olduğunu biliyor)
    List<HistoricalDataDto> fetchHistoricalData(String symbol, String range, String interval, String startDate, String endDate);

}