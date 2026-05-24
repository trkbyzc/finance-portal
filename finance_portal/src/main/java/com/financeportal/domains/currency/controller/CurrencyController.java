package com.financeportal.domains.currency.controller;

import com.financeportal.domains.currency.dto.CurrencyDto;
import com.financeportal.domains.currency.service.CurrencyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market-data")
@RequiredArgsConstructor
@Tag(name = "Döviz Kurları", description = "TCMB Güncel Döviz Verileri")
public class CurrencyController {

    private final CurrencyService currencyService;

    @GetMapping("/currencies")
    @Operation(summary = "TCMB Güncel Döviz Kurlarını Getir")
    public ResponseEntity<List<CurrencyDto>> getCurrencyRates() {
        return ResponseEntity.ok(currencyService.getCurrencyRates());
    }

    @GetMapping("/currencies/{code}/historical")
    @Operation(summary = "Bir döviz kodunun TRY karşılığı geçmiş günlük serisi (örn. USD = 1 USD = X TRY)",
            description = "Frontend'de historical conversion için kullanılır (her tarih için doğru USDTRY kuru).")
    public ResponseEntity<List<Map<String, Object>>> getCurrencyHistorical(
            @PathVariable String code,
            @RequestParam(defaultValue = "5y") String range) {
        return ResponseEntity.ok(currencyService.getCurrencyHistorical(code, range));
    }
}