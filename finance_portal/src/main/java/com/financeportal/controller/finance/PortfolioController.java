package com.financeportal.controller;

import com.financeportal.model.dto.portfolio.PortfolioItemDto;
import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.service.PortfolioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
@Tag(name = "Portföy Yönetimi", description = "Varlık Alım/Satım ve Portföy Görüntüleme İşlemleri")
public class PortfolioController {

    private final PortfolioService portfolioService;

    @PostMapping("/user/{userId}/buy")
    @Operation(summary = "Varlık Satın Al", description = "Kullanıcının TRY bakiyesinden düşülerek portföye varlık ekler.")
    public ResponseEntity<Map<String, String>> buyAsset(@PathVariable UUID userId, @RequestBody TradeRequestDto request) {
        portfolioService.buyAsset(userId, request);
        return ResponseEntity.ok(Map.of("message", request.getSymbol() + " başarıyla satın alındı ve portföye eklendi."));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Kullanıcının Portföyünü Getir", description = "Sahip olunan tüm varlıkları ve maliyetlerini listeler.")
    public ResponseEntity<List<PortfolioItemDto>> getPortfolio(@PathVariable UUID userId) {
        return ResponseEntity.ok(portfolioService.getPortfolioByUserId(userId));
    }

    @PostMapping("/user/{userId}/sell")
    @Operation(summary = "Varlık Sat", description = "Portföydeki varlığı satar ve geliri TRY bakiyesine ekler.")
    public ResponseEntity<Map<String, String>> sellAsset(@PathVariable UUID userId, @RequestBody TradeRequestDto request) {
        portfolioService.sellAsset(userId, request);
        return ResponseEntity.ok(Map.of("message", request.getQuantity() + " adet " + request.getSymbol() + " başarıyla satıldı. Elde edilen gelir hesabınıza eklendi."));
    }

    @GetMapping("/user/{userId}/summary")
    @Operation(summary = "Portföy Dağılım Özeti (Pasta Grafik)", description = "Kullanıcının nakit ve varlıklarının oransal dağılımını hesaplar.")
    public ResponseEntity<PortfolioSummaryDto> getPortfolioSummary(@PathVariable UUID userId) {
        return ResponseEntity.ok(portfolioService.getPortfolioSummary(userId));
    }
}