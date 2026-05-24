package com.financeportal.domains.eurobond.controller;

import com.financeportal.domains.eurobond.dto.EurobondAggregateDto;
import com.financeportal.domains.eurobond.service.EurobondService;
import com.financeportal.model.dto.market.MarketAssetDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/market-data/eurobonds")
@RequiredArgsConstructor
@Tag(name = "Eurobond", description = "Türkiye Eurobond proxy (Yahoo EMB ETF) + EVDS aggregate dış borç görünümü")
public class EurobondController {

    private final EurobondService eurobondService;

    @GetMapping
    @Operation(summary = "Eurobond proxy listesi (EMB ETF)")
    public ResponseEntity<List<MarketAssetDto>> getEurobondList() {
        return ResponseEntity.ok(eurobondService.getEurobondList());
    }

    @GetMapping("/aggregate")
    @Operation(summary = "Türkiye Dış Borçlanma Görünümü (EVDS aggregate)",
            description = "Toplam stok / döviz cinsi dağılımı / vade dağılımı.")
    public ResponseEntity<EurobondAggregateDto> getAggregate() {
        return ResponseEntity.ok(eurobondService.getAggregateOverview());
    }
}
