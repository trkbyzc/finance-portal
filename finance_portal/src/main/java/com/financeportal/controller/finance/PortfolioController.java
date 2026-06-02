package com.financeportal.controller.finance;

import com.financeportal.model.dto.portfolio.PortfolioDto;
import com.financeportal.model.dto.portfolio.PortfolioItemDto;
import com.financeportal.model.dto.portfolio.TradeRequestDto;
import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.model.dto.portfolio.TransactionDto;
import com.financeportal.service.portfolio.PortfolioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
@Tag(name = "Portföy Yönetimi", description = "Manuel portföy takibi: varlık ekleme, güncelleme, silme ve kâr/zarar analizi")
public class PortfolioController {

    private final PortfolioService portfolioService;

    // ---------- Portföy yönetimi (çoklu adlandırılmış portföy) ----------

    @GetMapping("/list")
    @Operation(summary = "Portföylerim", description = "Kullanıcının adlandırılmış portföyleri (en az 'Ana Portföy').")
    public ResponseEntity<List<PortfolioDto>> listPortfolios() {
        return ResponseEntity.ok(portfolioService.listPortfolios());
    }

    @PostMapping("/list")
    @Operation(summary = "Yeni Portföy Oluştur")
    public ResponseEntity<PortfolioDto> createPortfolio(@RequestBody Map<String, String> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(portfolioService.createPortfolio(body.get("name")));
    }

    @PutMapping("/list/{portfolioId}")
    @Operation(summary = "Portföyü Yeniden Adlandır")
    public ResponseEntity<PortfolioDto> renamePortfolio(@PathVariable UUID portfolioId, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(portfolioService.renamePortfolio(portfolioId, body.get("name")));
    }

    @DeleteMapping("/list/{portfolioId}")
    @Operation(summary = "Portföyü Sil", description = "Portföyü ve içindeki varlıkları siler. Son portföy silinemez.")
    public ResponseEntity<Map<String, String>> deletePortfolio(@PathVariable UUID portfolioId) {
        portfolioService.deletePortfolio(portfolioId);
        return ResponseEntity.ok(Map.of("message", "Portföy silindi."));
    }

    @GetMapping("/me")
    @Operation(summary = "Portföyümü Getir", description = "Seçili (veya varsayılan) portföydeki varlıkları ve kâr/zarar analizlerini listeler.")
    public ResponseEntity<List<PortfolioItemDto>> getMyPortfolio(@RequestParam(required = false) UUID portfolioId) {
        return ResponseEntity.ok(portfolioService.getMyPortfolio(portfolioId));
    }

    @GetMapping("/summary")
    @Operation(summary = "Portföy Özeti", description = "Seçili portföyün varlık dağılımını ve toplam kâr/zarar durumunu döner.")
    public ResponseEntity<PortfolioSummaryDto> getMyPortfolioSummary(@RequestParam(required = false) UUID portfolioId) {
        return ResponseEntity.ok(portfolioService.getMyPortfolioSummary(portfolioId));
    }

    @PostMapping("/add")
    @Operation(summary = "Portföye Varlık Ekle", description = "Daha önce alınmış varlıkları takip amaçlı portföye ekler.")
    public ResponseEntity<Map<String, String>> addManualEntry(@RequestBody TradeRequestDto request) {
        portfolioService.addManualEntry(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", request.getSymbol() + " başarıyla portföye eklendi."));
    }

    @PutMapping("/update")
    @Operation(summary = "Portföydeki Varlığı Güncelle", description = "Mevcut varlığın miktarını ve alış fiyatını günceller.")
    public ResponseEntity<Map<String, String>> updateManualEntry(@RequestBody TradeRequestDto request) {
        portfolioService.updateManualEntry(request);
        return ResponseEntity.ok(Map.of("message", request.getSymbol() + " başarıyla güncellendi."));
    }

    @DeleteMapping("/remove")
    @Operation(summary = "Portföyden Varlık Sil", description = "Belirtilen miktarda varlığı portföyden çıkarır. Miktar verilmezse tamamen siler.")
    public ResponseEntity<Map<String, String>> removeFromPortfolio(@RequestBody TradeRequestDto request) {
        portfolioService.removeFromPortfolio(request);
        return ResponseEntity.ok(Map.of("message", request.getSymbol() + " portföyden çıkarıldı."));
    }

    @GetMapping("/transactions")
    @Operation(
            summary = "İşlem Geçmişi",
            description = "Kullanıcının BUY/SELL hareketlerini pageable olarak döner. Symbol ve tarih aralığı filtreleri opsiyonel. " +
                    "'Backfilled from portfolio_items' notu olan satırlar V12 migration'ından gelen synthetic BUY'lardır."
    )
    public ResponseEntity<Page<TransactionDto>> getTransactions(
            @RequestParam(required = false) String symbol,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(portfolioService.getMyTransactions(symbol, fromDate, toDate, page, size));
    }
}
