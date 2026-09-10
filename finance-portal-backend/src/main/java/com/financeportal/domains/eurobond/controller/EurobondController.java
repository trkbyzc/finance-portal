package com.financeportal.domains.eurobond.controller;

import com.financeportal.domains.eurobond.dto.EurobondDto;
import com.financeportal.domains.eurobond.service.EurobondService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/market-data/eurobonds")
@RequiredArgsConstructor
@Tag(name = "Eurobond", description = "Türkiye Hazine eurobondları (businessinsider canlı veri)")
public class EurobondController {

    private final EurobondService eurobondService;

    @GetMapping
    @Operation(summary = "Türkiye Hazine eurobond listesi",
            description = "USD/EUR cinsi TR Hazine eurobondları: kupon, vade, döviz, fiyat, getiri, günlük değişim.")
    public ResponseEntity<List<EurobondDto>> getEurobondList() {
        return ResponseEntity.ok(eurobondService.getEurobondList());
    }
}
