package com.financeportal.controller.market;

import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.service.market.MarketChartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/analysis")
@RequiredArgsConstructor
@Tag(name = "Analiz ve Tarihsel Veri", description = "Grafik çizimi ve trend analizleri için gerçek tarihsel veriler")
public class AnalysisController {

    private final MarketChartService marketDataService;

    @GetMapping("/historical/{symbol}")
    @Operation(summary = "Tarihsel Veri ve Hareketli Ortalama (MA)")
    public ResponseEntity<List<HistoricalDataDto>> getHistoricalData(
            @PathVariable String symbol,
            @RequestParam(required = false, defaultValue = "UNKNOWN") String category,
            @RequestParam(defaultValue = "1mo") String range,
            @RequestParam(defaultValue = "1d") String interval,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "5") int maPeriod) {

        return ResponseEntity.ok(marketDataService.getHistoricalDataWithEvdsFallback(
                symbol, category, range, interval, startDate, endDate, maPeriod));
    }
}