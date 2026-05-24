package com.financeportal.domains.crypto.controller;

import com.financeportal.domains.crypto.dto.CryptoDto;
import com.financeportal.domains.crypto.service.CryptoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
// FRONTEND PATLAMASIN DİYE ESKİ URL KORUNDU
@RequestMapping("/api/market-data")
@RequiredArgsConstructor
@Tag(name = "Kripto Paralar", description = "CoinGecko üzerinden anlık kripto para verileri")
public class CryptoController {

    private final CryptoService cryptoService;

    @GetMapping("/crypto-currencies")
    @Operation(summary = "Kripto Para Kurlarını Getir")
    public ResponseEntity<List<CryptoDto>> getCryptoRates() {
        return ResponseEntity.ok(cryptoService.getCryptoRates());
    }
}