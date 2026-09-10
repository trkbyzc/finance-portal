package com.financeportal.domains.crypto.controller;

import com.financeportal.domains.crypto.dto.CryptoDto;
import com.financeportal.domains.crypto.dto.CryptoFundamentalsDto;
import com.financeportal.domains.crypto.service.CryptoService;
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
@RequestMapping("/market-data")
@RequiredArgsConstructor
@Tag(name = "Kripto Paralar", description = "CoinGecko üzerinden anlık kripto para verileri")
public class CryptoController {

    private final CryptoService cryptoService;

    @GetMapping("/crypto-currencies")
    @Operation(summary = "Kripto Para Kurlarını Getir")
    public ResponseEntity<List<CryptoDto>> getCryptoRates() {
        return ResponseEntity.ok(cryptoService.getCryptoRates());
    }

    @GetMapping("/crypto-fundamentals")
    @Operation(summary = "Kripto temel verisi (piyasa değeri/sıra/24s aralık/arz/ATH)")
    public ResponseEntity<CryptoFundamentalsDto> getCryptoFundamentals(@RequestParam String id) {
        return ResponseEntity.ok(cryptoService.getFundamentals(id));
    }

    @GetMapping("/fear-greed")
    @Operation(summary = "Crypto Fear & Greed Index (tüm günlük geçmiş)")
    public ResponseEntity<List<com.financeportal.domains.crypto.dto.FearGreedDto>> getFearGreed() {
        return ResponseEntity.ok(cryptoService.getFearGreed());
    }
}