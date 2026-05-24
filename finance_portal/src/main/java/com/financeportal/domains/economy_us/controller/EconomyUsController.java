package com.financeportal.domains.economy_us.controller;

import com.financeportal.domains.economy_us.dto.EconomyUsDto;
import com.financeportal.domains.economy_us.service.EconomyUsService;
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
@RequestMapping("/api/market-data")
@RequiredArgsConstructor
@Tag(name = "Makro Ekonomi (ABD)", description = "ABD CPI verisi (FRED CPIAUCSL serisi)")
public class EconomyUsController {

    private final EconomyUsService economyUsService;

    @GetMapping("/economy-us")
    @Operation(summary = "ABD Anlık CPI Snapshot (endeks + YoY %)")
    public ResponseEntity<EconomyUsDto> getEconomyData() {
        return ResponseEntity.ok(economyUsService.getMacroEconomyData());
    }

    @GetMapping("/economy-us/historical")
    @Operation(summary = "ABD CPI Tarihsel Veri (raw endeks)",
            description = "Frontend basePrice normalize ettiği için raw endeks döndürülür.")
    public ResponseEntity<List<Map<String, Object>>> getEconomyHistory(
            @RequestParam(required = false) String metric,
            @RequestParam(defaultValue = "5y") String range) {
        // metric parametresi şimdilik sadece "usdInflationRate" için anlamlı; ileride başka FRED serisi eklenirse switch.
        return ResponseEntity.ok(economyUsService.getEconomyHistory(range));
    }
}
