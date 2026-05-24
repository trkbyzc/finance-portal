package com.financeportal.domains.bond.controller;

import com.financeportal.domains.bond.service.BondService;
import com.financeportal.model.dto.market.MarketAssetDto;
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
@Tag(name = "Global Tahviller", description = "Yahoo Finance Üzerinden Global Tahvil Verileri")
public class BondController {

    private final BondService bondService;

    @GetMapping("/bonds")
    @Operation(summary = "Global Tahvil Verilerini Getir")
    public ResponseEntity<List<MarketAssetDto>> getBonds() {
        return ResponseEntity.ok(bondService.getGlobalBonds());
    }
}