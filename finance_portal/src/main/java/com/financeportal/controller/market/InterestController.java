package com.financeportal.controller.market;

import com.financeportal.model.dto.account.DepositRatePointDto;
import com.financeportal.model.dto.account.InterestYieldDto;
import com.financeportal.service.market.InterestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/interest")
@RequiredArgsConstructor
@Tag(name = "Faiz ve Mevduat Modülü", description = "Mevduat getirisi hesaplama operasyonları")
public class InterestController {

    private final InterestService interestService;

    @GetMapping("/calculate")
    @Operation(summary = "Tüm Bankaların Net Mevduat Getirisini Hesapla")
    public ResponseEntity<List<InterestYieldDto>> calculateYields(
            @RequestParam(defaultValue = "100000") BigDecimal amount,
            @RequestParam(defaultValue = "32") int days) {

        return ResponseEntity.ok(interestService.calculateDepositYields(amount, days));
    }

    @GetMapping("/deposit-series")
    @Operation(summary = "TRY Mevduat Faizi Tarihsel Serisi (1 yıla kadar, EVDS) — Performans karşılaştırması için")
    public ResponseEntity<List<DepositRatePointDto>> depositSeries(
            @RequestParam(defaultValue = "5y") String range) {

        return ResponseEntity.ok(interestService.getDepositRateSeries(range));
    }
}