package com.financeportal.domains.effective_currency.controller;

import com.financeportal.domains.effective_currency.dto.EffectiveCurrencyDto;
import com.financeportal.domains.effective_currency.service.EffectiveCurrencyService;
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
@RequestMapping("/market-data")
@RequiredArgsConstructor
@Tag(name = "Efektif Döviz", description = "TCMB Banknote (nakit/efektif) kurları + EVDS *.EF.YTL tarihçeleri")
public class EffectiveCurrencyController {

    private final EffectiveCurrencyService effectiveCurrencyService;

    @GetMapping("/effective-currencies")
    @Operation(summary = "TCMB Efektif Döviz Kurlarını Getir",
            description = "Nakit/banknot alış-satış kurları (BanknoteBuying/BanknoteSelling). " +
                    "Frontend useMarketData hook'u için /market-data/{endpoint} contract'ına uyar.")
    public ResponseEntity<List<EffectiveCurrencyDto>> getEffectiveCurrencies() {
        return ResponseEntity.ok(effectiveCurrencyService.getEffectiveCurrencies());
    }

    @GetMapping("/effective-currencies/{code}/historical")
    @Operation(summary = "Efektif döviz tarihçesi",
            description = "EVDS TP.DK.{CCY}.S.EF.YTL serisinden günlük tarihçe.")
    public ResponseEntity<List<Map<String, Object>>> getEffectiveCurrencyHistorical(
            @PathVariable String code,
            @RequestParam(defaultValue = "5y") String range) {
        return ResponseEntity.ok(effectiveCurrencyService.getEffectiveCurrencyHistorical(code, range));
    }
}
