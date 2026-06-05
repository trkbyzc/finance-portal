package com.financeportal.domains.economy.controller;

import com.financeportal.domains.economy.dto.EconomyDto;
import com.financeportal.domains.economy.service.EconomyService; // 🚀 DİKKAT: SyncService DEĞİL!
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/market-data")
@RequiredArgsConstructor
@Tag(name = "Makro Ekonomi", description = "Türkiye Enflasyon, İşsizlik ve Faiz Verileri")
public class EconomyController {

    private final EconomyService economyService; // 🚀 BURASI DÜZELTİLDİ

    @GetMapping("/economy")
    @Operation(summary = "Temel Ekonomik Göstergeleri Getir (Canlı)")
    public ResponseEntity<EconomyDto> getEconomyData() {
        return ResponseEntity.ok(economyService.getMacroEconomyData());
    }

    @GetMapping("/economy/historical")
    @Operation(summary = "Ekonomik Metriklerin Geçmiş Verilerini Getir")
    public ResponseEntity<List<Map<String, Object>>> getEconomyHistory(
            @RequestParam String metric,
            @RequestParam(defaultValue = "10y") String range) {
        return ResponseEntity.ok(economyService.getEconomyHistory(metric, range));
    }

    @GetMapping("/economy/indicators")
    @Operation(summary = "Ekonomi göstergeleri kayıt defteri (key, kategori, birim)")
    public ResponseEntity<List<Map<String, Object>>> getIndicators() {
        return ResponseEntity.ok(economyService.getIndicators());
    }
}