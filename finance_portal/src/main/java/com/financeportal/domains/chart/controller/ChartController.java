package com.financeportal.domains.chart.controller;

import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.service.market.MarketChartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/market-data")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Grafik ve Tarihçe", description = "Tüm Varlıklar İçin Grafik Verileri")
public class ChartController {

    private final MarketChartService marketChartService;

    @GetMapping("/historical")
    @Operation(summary = "Varlıklar İçin Detaylı Tarihsel Fiyat Verilerini Getir")
    public ResponseEntity<List<HistoricalDataDto>> getHistoricalData(
            @RequestParam String symbol,
            @RequestParam(required = false, defaultValue = "UNKNOWN") String category,
            @RequestParam(defaultValue = "1mo") String range,
            @RequestParam(defaultValue = "1d") String interval,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "10") int maPeriod) {

        log.info("🎯 [CONTROLLER-DEBUG] İstek Geldi -> Symbol: '{}', Category: '{}', Range: '{}'", symbol, category, range);

        return ResponseEntity.ok(marketChartService.getHistoricalDataWithEvdsFallback(
                symbol, category, range, interval, startDate, endDate, maPeriod));
    }
}