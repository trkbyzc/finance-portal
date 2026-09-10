package com.financeportal.domains.news.controller;

import com.financeportal.domains.news.dto.ArticleContentResponseDto;
import com.financeportal.domains.news.dto.NewsDto;
import com.financeportal.domains.news.dto.NewsPageResponseDto;
import com.financeportal.domains.news.service.NewsService;
import com.financeportal.domains.news.service.NewsSyncService;
import com.financeportal.model.dto.common.MessageResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/news")
@RequiredArgsConstructor
@Tag(name = "Haber ve Takvim", description = "Finansal haberler, haber içerikleri ve ekonomik takvim")
public class NewsController {

    private final NewsService newsService;
    private final NewsSyncService newsSyncService;

    @GetMapping
    @Operation(summary = "Haberleri Sayfalı Şekilde Getir",
               description = "lang=en gönderildiğinde title/description/category İngilizce'ye çevrilmiş şekilde döner (sync sırasında cache'lenmiş çeviriden).")
    public ResponseEntity<NewsPageResponseDto> getNews(
            @RequestParam(defaultValue = "Tümü") String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "tr") String lang) {
        return ResponseEntity.ok(newsService.getPagedNews(category, page, size, lang));
    }

    @GetMapping("/by-symbol")
    @Operation(summary = "Bir Varlığı Etkileyen Haberler",
               description = "relatedSymbol etiketi verilen sembolle eşleşen haberleri döner (varlık detayındaki 'İlgili Haberler').")
    public ResponseEntity<List<NewsDto>> getNewsBySymbol(
            @RequestParam String symbol,
            @RequestParam(defaultValue = "6") int limit,
            @RequestParam(defaultValue = "tr") String lang) {
        return ResponseEntity.ok(newsService.getNewsBySymbol(symbol, limit, lang));
    }

    @GetMapping("/content")
    @Operation(summary = "Haberin Tam Metnini Çek (Scraping)",
               description = "lang=en için scraped content LibreTranslate ile çevrilir ve 7 gün cache'lenir.")
    public ResponseEntity<ArticleContentResponseDto> getArticleContent(
            @RequestParam String url,
            @RequestParam(defaultValue = "tr") String lang) {
        String content = newsService.getArticleContent(url, lang);
        return ResponseEntity.ok(new ArticleContentResponseDto(content));
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
    public ResponseEntity<MessageResponseDto> triggerSync() {
        newsSyncService.fetchAndCacheNews();
        return ResponseEntity.ok(MessageResponseDto.of("Sync triggered."));
    }
}
