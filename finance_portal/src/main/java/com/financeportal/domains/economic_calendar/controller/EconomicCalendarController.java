package com.financeportal.domains.economic_calendar.controller;

import com.financeportal.domains.economic_calendar.dto.EconomicEventDto;
import com.financeportal.domains.economic_calendar.service.EconomicCalendarService;
import com.financeportal.model.enums.EventImpact;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/economic-calendar")
@RequiredArgsConstructor
@Tag(name = "Ekonomik Takvim", description = "Finnhub kaynaklı global ekonomik olay takvimi")
public class EconomicCalendarController {

    private final EconomicCalendarService economicCalendarService;

    @GetMapping
    @Operation(
            summary = "Ekonomik takvim event listesi",
            description = "Cache'lenmiş Finnhub verisi üzerinden filter'lı liste döner. " +
                    "Tüm filtreler opsiyonel — boş geçilirse tüm event'ler döner."
    )
    public ResponseEntity<List<EconomicEventDto>> getEvents(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String countries, // "US,EU,TR" gibi virgülle ayrılmış
            @RequestParam(required = false) EventImpact minImpact
    ) {
        Set<String> countrySet = (countries == null || countries.isBlank())
                ? null
                : Arrays.stream(countries.split(","))
                        .map(String::trim).filter(s -> !s.isEmpty())
                        .map(String::toUpperCase)
                        .collect(Collectors.toSet());
        return ResponseEntity.ok(economicCalendarService.getEvents(from, to, countrySet, minImpact));
    }
}
