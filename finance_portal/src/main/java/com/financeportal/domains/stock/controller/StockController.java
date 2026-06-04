package com.financeportal.domains.stock.controller;

import com.financeportal.domains.stock.dto.StockDto;
import com.financeportal.domains.stock.dto.StockFundamentalsDto;
import com.financeportal.domains.stock.service.StockFundamentalsService;
import com.financeportal.domains.stock.service.StockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/market-data")
@RequiredArgsConstructor
@Tag(name = "Hisse ve Endeksler", description = "BİST ve Global Hisseler/Endeksler")
public class StockController {

    private final StockService stockService;
    private final StockFundamentalsService stockFundamentalsService;

    @GetMapping("/stocks")
    @Operation(summary = "Tüm Hisse Senetlerini Getir")
    public ResponseEntity<List<StockDto>> getStocks() {
        return ResponseEntity.ok(stockService.getStocks());
    }

    @GetMapping("/indices")
    @Operation(summary = "BİST ve Global Endeksleri Getir")
    public ResponseEntity<List<StockDto>> getIndices() {
        return ResponseEntity.ok(stockService.getIndices());
    }

    @GetMapping("/stock-fundamentals")
    @Operation(summary = "Hisse temel verisi (aralık/hacim + piyasa değeri/halka açıklık/sektör)")
    public ResponseEntity<StockFundamentalsDto> getStockFundamentals(@RequestParam String symbol) {
        return ResponseEntity.ok(stockFundamentalsService.getFundamentals(symbol));
    }
}