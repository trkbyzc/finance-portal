package com.financeportal.domains.turkish_bond.controller;

import com.financeportal.domains.turkish_bond.service.TurkishBondService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market-data")
@RequiredArgsConstructor
@Tag(name = "Türk Tahvilleri", description = "EVDS Üzerinden Güncel Türk Devlet Tahvilleri")
public class TurkishBondController {

    private final TurkishBondService turkishBondService;

    @GetMapping("/tr-bonds")
    @Operation(summary = "Türk Devlet Tahvillerini ve Getiri Eğrisini Getir")
    public ResponseEntity<List<Map<String, Object>>> getTurkishBonds() {
        return ResponseEntity.ok(turkishBondService.getTurkishBonds());
    }
}