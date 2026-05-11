package com.financeportal.controller.user;

import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.service.market.MarketDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
@Tag(name = "Analiz ve Tarihsel Veri", description = "Grafik çizimi ve trend analizleri için gerçek tarihsel veriler")
public class AnalysisController {

    private final MarketDataService marketDataService;

    @GetMapping("/historical/{symbol}")
    @Operation(summary = "Tarihsel Veri ve Hareketli Ortalama (MA)")
    public ResponseEntity<List<HistoricalDataDto>> getHistoricalData(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "1mo") String range,
            @RequestParam(defaultValue = "1d") String interval, // 🚀 BURASI EKLENDİ
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "5") int maPeriod) {

        // 🚀 6 PARAMETRE İLE ÇAĞIRIYORUZ
        return ResponseEntity.ok(marketDataService.getRealHistoricalData(symbol, range, interval, startDate, endDate, maPeriod));
    }
}