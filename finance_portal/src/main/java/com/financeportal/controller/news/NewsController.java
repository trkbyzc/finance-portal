package com.financeportal.controller;

import com.financeportal.service.NewsService;
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

    @GetMapping
    @Operation(summary = "Haberleri Sayfalı Şekilde Getir")
    public ResponseEntity<Map<String, Object>> getNews(
            @RequestParam(defaultValue = "Tümü") String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(newsService.getPagedNews(category, page, size));
    }

    // 🚀 VİZYON: Kullanıcı siteden çıkmadan haberi okusun diye açtığımız endpoint
    @GetMapping("/content")
    @Operation(summary = "Haberin Tam Metnini Çek (Scraping)")
    public ResponseEntity<Map<String, String>> getArticleContent(@RequestParam String url) {
        String content = newsService.getArticleContent(url);
        return ResponseEntity.ok(Map.of("content", content));
    }

    // 🚀 VİZYON: Sitemizin bir de canlı Ekonomik Takvimi var
    @GetMapping("/calendar")
    @Operation(summary = "Canlı Ekonomik Takvimi Getir")
    public ResponseEntity<List<Map<String, String>>> getEconomicCalendar() {
        return ResponseEntity.ok(newsService.getEconomicCalendar());
    }
}