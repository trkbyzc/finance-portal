package com.financeportal.domains.fund.controller;

import com.financeportal.domains.fund.dto.FundDto;
import com.financeportal.domains.fund.service.FundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/market-data")
@RequiredArgsConstructor
@Tag(name = "Yatırım Fonları", description = "TEFAS ve Global ETF Fonları")
public class FundController {

    private final FundService fundService;

    @GetMapping("/global-funds")
    @Operation(summary = "Global Fon Verilerini Getir (ETF)")
    public ResponseEntity<List<FundDto>> getGlobalFunds() {
        return ResponseEntity.ok(fundService.getGlobalFunds());
    }

    @GetMapping("/tr-funds")
    @Operation(summary = "Türkiye Yatırım Fonlarını Getir (TEFAS)")
    public ResponseEntity<List<FundDto>> getTrFunds() {
        return ResponseEntity.ok(fundService.getTrFunds());
    }
}