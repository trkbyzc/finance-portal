package com.financeportal.domains.future.controller;

import com.financeportal.domains.future.dto.FutureDto;
import com.financeportal.domains.future.service.FutureService;
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
@Tag(name = "Global Vadeliler", description = "Yahoo Finance Üzerinden Global Vadeli İşlem Verileri")
public class FutureController {

    private final FutureService futureService;

    @GetMapping("/futures")
    @Operation(summary = "Global Vadeli İşlem Verilerini Getir (Yahoo)")
    public ResponseEntity<List<FutureDto>> getFutures() {
        return ResponseEntity.ok(futureService.getFutures());
    }
}