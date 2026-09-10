package com.financeportal.domains.bank_currency.controller;

import com.financeportal.domains.bank_currency.service.BankCurrencyService;
import com.financeportal.domains.bank_currency.dto.BankCurrencyDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/market-data")
@RequiredArgsConstructor
@Tag(name = "Banka Kurları", description = "Hesapkurdu üzerinden banka makaslı döviz verileri")
public class BankCurrencyController {

    private final BankCurrencyService bankCurrencyService;

    @GetMapping("/bank-currencies")
    @Operation(summary = "Banka Bazlı Simüle Edilmiş Döviz Kurlarını Getir")
    public ResponseEntity<List<BankCurrencyDto>> getSimulatedBankRates() {
        return ResponseEntity.ok(bankCurrencyService.getBankRates());
    }
}