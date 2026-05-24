package com.financeportal.domains.ipo.controller;

import com.financeportal.domains.ipo.dto.IpoDto;
import com.financeportal.domains.ipo.service.IpoService;
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
@Tag(name = "Halka Arz (IPO)", description = "Halka Arz Takvimi")
public class IpoController {

    private final IpoService ipoService;

    @GetMapping("/ipo")
    @Operation(summary = "Halka Arz Takvimini Getir")
    public ResponseEntity<List<IpoDto>> getIPOCalendar() {
        return ResponseEntity.ok(ipoService.getIPOCalendar());
    }
}