package com.financeportal.domains.commodity.controller;

import com.financeportal.domains.commodity.dto.CommodityDto;
import com.financeportal.domains.commodity.service.CommodityService;
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
@Tag(name = "Emtia ve Altın", description = "Global Emtialar ve Türkiye Kapalıçarşı Altın Fiyatları")
public class CommodityController {

    private final CommodityService commodityService;

    @GetMapping("/commodities")
    @Operation(summary = "Emtia Fiyatlarını Getir (Yahoo)")
    public ResponseEntity<List<CommodityDto>> getCommodities() {
        return ResponseEntity.ok(commodityService.getCommodities());
    }

    @GetMapping("/turkish-gold")
    @Operation(summary = "Türkiye Kapalıçarşı Altın Fiyatlarını Getir (Trunçgil)")
    public ResponseEntity<List<CommodityDto>> getTurkishGold() {
        return ResponseEntity.ok(commodityService.getTurkishGold());
    }
}