package com.financeportal.domains.news.controller;

import com.financeportal.domains.news.service.NewsService;
import com.financeportal.domains.news.service.NewsSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
@Tag(name = "Haber ve Takvim", description = "Finansal haberler, haber içerikleri ve ekonomik takvim")
public class NewsController {

    private final NewsService newsService;
    private final NewsSyncService newsSyncService;

    @GetMapping
    @Operation(summary = "Haberleri Sayfalı Şekilde Getir",
               description = "lang=en gönderildiğinde title/description/category İngilizce'ye çevrilmiş şekilde döner (sync sırasında cache'lenmiş çeviriden).")
    public ResponseEntity<Map<String, Object>> getNews(
            @RequestParam(defaultValue = "Tümü") String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "tr") String lang) {
        return ResponseEntity.ok(newsService.getPagedNews(category, page, size, lang));
    }

    @GetMapping("/content")
    @Operation(summary = "Haberin Tam Metnini Çek (Scraping)",
               description = "lang=en için scraped content LibreTranslate ile çevrilir ve 7 gün cache'lenir.")
    public ResponseEntity<Map<String, String>> getArticleContent(
            @RequestParam String url,
            @RequestParam(defaultValue = "tr") String lang) {
        String content = newsService.getArticleContent(url, lang);
        return ResponseEntity.ok(Map.of("content", content));
    }

    @GetMapping("/calendar")
    @Operation(summary = "Canlı Ekonomik Takvimi Getir")
    public ResponseEntity<List<Map<String, String>>> getEconomicCalendar() {
        return ResponseEntity.ok(newsService.getEconomicCalendar());
    }

    /**
     * Manuel sync tetikleyici — LibreTranslate hazır olmadan başlayan sync'lerden sonra
     * çeviri pass'ı zorla çalıştırmak için. Zamanlanmış (15 dk) sync'i beklemeden
     * cache'i çevirilerle günceller. Dev ergonomisi.
     */
    @PostMapping("/sync")
    @Operation(summary = "Haber Sync'ini Tetikle",
               description = "Mevcut haberlere LibreTranslate ile EN çeviri pass'ı uygular ve cache'i tazeler.")
    public ResponseEntity<Map<String, String>> triggerSync() {
        newsSyncService.fetchAndCacheNews();
        return ResponseEntity.ok(Map.of("status", "Sync triggered."));
    }
}