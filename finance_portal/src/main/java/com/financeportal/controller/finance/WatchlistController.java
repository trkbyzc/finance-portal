package com.financeportal.controller.finance;

import com.financeportal.model.dto.watchlist.WatchlistAddRequestDto;
import com.financeportal.model.dto.watchlist.WatchlistItemDto;
import com.financeportal.service.watchlist.WatchlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/watchlist")
@RequiredArgsConstructor
@Tag(name = "İzleme Listesi", description = "Kullanıcının takip listesi (favori sembolleri) — quantity/price tutmadan sadece sembol takibi.")
public class WatchlistController {

    private final WatchlistService watchlistService;

    @GetMapping("/me")
    @Operation(summary = "İzleme Listemi Getir",
            description = "Giriş yapmış kullanıcının izleme listesindeki tüm sembolleri canlı fiyat + günlük değişim + sparkline ile döner.")
    public ResponseEntity<List<WatchlistItemDto>> getMyWatchlist() {
        return ResponseEntity.ok(watchlistService.getMyWatchlist());
    }

    @PostMapping("/add")
    @Operation(summary = "İzleme Listesine Ekle",
            description = "Sembolü kullanıcının izleme listesine ekler. Aynı sembol+asset türü zaten varsa idempotent davranır (yeni kayıt açmaz).")
    public ResponseEntity<WatchlistItemDto> addToWatchlist(@RequestBody WatchlistAddRequestDto request) {
        WatchlistItemDto created = watchlistService.addToWatchlist(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/remove/{itemId}")
    @Operation(summary = "İzleme Listesinden Sil",
            description = "Belirtilen kaydı izleme listesinden kaldırır. Sadece sahibi silebilir; başka kullanıcının kaydı 404 döner.")
    public ResponseEntity<Map<String, String>> removeFromWatchlist(@PathVariable UUID itemId) {
        watchlistService.removeFromWatchlist(itemId);
        return ResponseEntity.ok(Map.of("message", "İzleme listesinden kaldırıldı."));
    }
}
