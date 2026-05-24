package com.financeportal.domains.viop.controller;

import com.financeportal.domains.viop.dto.ViopDto;
import com.financeportal.domains.viop.service.ViopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/market-data")
@RequiredArgsConstructor
@Tag(name = "VİOP", description = "Yerel VİOP Kontratları")
public class ViopController {

    private final ViopService viopService;

    @GetMapping("/viop")
    @Operation(summary = "İşYatırım Üzerinden Yerel VİOP Kontratlarını Getir")
    public ResponseEntity<List<ViopDto>> getViopData() {
        return ResponseEntity.ok(viopService.getViopData());
    }
}