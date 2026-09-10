package com.financeportal.news.service;

import com.financeportal.news.client.NewsScraperClient;
import com.financeportal.news.dto.NewsDto;
import com.financeportal.news.dto.NewsPageResponseDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NewsServiceTest {

    @Mock private NewsSyncService syncService;
    @Mock private NewsScraperClient scraperClient;
    @Mock private com.financeportal.news.client.TranslationClient translationClient;
    @Mock private org.springframework.data.redis.core.StringRedisTemplate stringRedisTemplate;

    @InjectMocks private NewsService service;

    private NewsDto news(String title, String category) {
        NewsDto n = new NewsDto();
        n.setTitle(title);
        n.setCategory(category);
        n.setLink("http://link/" + title);
        return n;
    }

    @Test
    void getPagedNews_tumuCategory_returnsAll() {
        when(syncService.getCachedNews()).thenReturn(List.of(
                news("T1", "Kripto"), news("T2", "Borsa"), news("T3", "Genel")));

        NewsPageResponseDto result = service.getPagedNews("Tümü", 0, 10);

        assertEquals(3, result.getContent().size());
        assertFalse(result.isHasNext());
    }

    @Test
    void getPagedNews_specificCategory_filtersMatching() {
        when(syncService.getCachedNews()).thenReturn(List.of(
                news("T1", "Kripto"), news("T2", "Borsa"), news("T3", "Kripto")));

        NewsPageResponseDto result = service.getPagedNews("Kripto", 0, 10);

        assertEquals(2, result.getContent().size());
    }

    @Test
    void getPagedNews_caseInsensitiveCategory() {
        when(syncService.getCachedNews()).thenReturn(List.of(
                news("T1", "Kripto"), news("T2", "KRIPTO")));

        NewsPageResponseDto result = service.getPagedNews("kripto", 0, 10);

        assertEquals(2, result.getContent().size());
    }

    @Test
    void getPagedNews_pagination_returnsCorrectSlice() {
        List<NewsDto> all = new java.util.ArrayList<>();
        for (int i = 0; i < 20; i++) all.add(news("T" + i, "Tümü"));
        when(syncService.getCachedNews()).thenReturn(all);

        NewsPageResponseDto result = service.getPagedNews("Tümü", 0, 5);

        assertEquals(5, result.getContent().size());
        assertTrue(result.isHasNext());
    }

    @Test
    void getPagedNews_lastPage_hasNextFalse() {
        List<NewsDto> all = new java.util.ArrayList<>();
        for (int i = 0; i < 12; i++) all.add(news("T" + i, "Tümü"));
        when(syncService.getCachedNews()).thenReturn(all);

        NewsPageResponseDto result = service.getPagedNews("Tümü", 2, 5);

        // page 2, size 5 → items 10-12 (2 items)
        assertEquals(2, result.getContent().size());
        assertFalse(result.isHasNext());
    }

    @Test
    void getPagedNews_pageOutOfRange_returnsEmpty() {
        when(syncService.getCachedNews()).thenReturn(List.of(
                news("T1", "Tümü"), news("T2", "Tümü")));

        NewsPageResponseDto result = service.getPagedNews("Tümü", 10, 5);

        assertTrue(result.getContent().isEmpty());
        assertFalse(result.isHasNext());
    }

    @Test
    void getPagedNews_emptyNewsList_returnsEmpty() {
        when(syncService.getCachedNews()).thenReturn(List.of());

        NewsPageResponseDto result = service.getPagedNews("Tümü", 0, 10);

        assertTrue(result.getContent().isEmpty());
    }

    @Test
    void getArticleContent_delegatesToScraper() {
        when(scraperClient.scrapeArticleContent("http://test.com")).thenReturn("Article body");

        assertEquals("Article body", service.getArticleContent("http://test.com"));
    }

    // -------- EN-mode (lang=en) --------

    @Test
    void getPagedNews_en_swapsTitleDescriptionCategoryFromCache() {
        NewsDto n = news("Borsa yükseldi", "Borsa");
        n.setDescription("BIST 100 endeksi rekor kırdı");
        n.setTitleEn("Stock market rose");
        n.setDescriptionEn("BIST 100 index hit record");
        n.setCategoryEn("Stocks");
        when(syncService.getCachedNews()).thenReturn(List.of(n));

        NewsPageResponseDto result = service.getPagedNews("Tümü", 0, 10, "en");

        List<NewsDto> content = result.getContent();
        assertEquals(1, content.size());
        NewsDto dto = content.get(0);
        assertEquals("Stock market rose", dto.getTitle());
        assertEquals("BIST 100 index hit record", dto.getDescription());
        assertEquals("Stocks", dto.getCategory());
    }

    @Test
    void getPagedNews_en_titleEnNull_fallsBackToOriginalTitle() {
        NewsDto n = news("Borsa yükseldi", "Borsa");
        n.setDescription("desc");
        // titleEn null — fallback original
        when(syncService.getCachedNews()).thenReturn(List.of(n));

        NewsPageResponseDto result = service.getPagedNews("Tümü", 0, 10, "en");

        NewsDto dto = result.getContent().get(0);
        assertEquals("Borsa yükseldi", dto.getTitle());
        assertEquals("desc", dto.getDescription());
        // Category from classifier mapping (Borsa → Stocks) since categoryEn null
        assertEquals("Stocks", dto.getCategory());
    }

    @Test
    void getPagedNews_en_AllCategoryWorks() {
        when(syncService.getCachedNews()).thenReturn(List.of(
                news("T1", "Kripto"), news("T2", "Borsa")));

        NewsPageResponseDto result = service.getPagedNews("All", 0, 10, "en");

        assertEquals(2, result.getContent().size());
    }

    @Test
    void getPagedNews_en_filterByEnglishCategory_matchesTrCache() {
        NewsDto n = news("Bitcoin", "Kripto");
        n.setTitleEn("Bitcoin");
        when(syncService.getCachedNews()).thenReturn(List.of(n, news("Borsa", "Borsa")));

        NewsPageResponseDto result = service.getPagedNews("Crypto", 0, 10, "en");

        assertEquals(1, result.getContent().size());
    }

    @Test
    void getPagedNews_en_originalDtoUnmodified() {
        // EN response cache'teki TR DTO'yu mutate etmemeli (clone yapılmalı).
        NewsDto cached = news("Tr başlık", "Kripto");
        cached.setTitleEn("EN title");
        when(syncService.getCachedNews()).thenReturn(List.of(cached));

        service.getPagedNews("Tümü", 0, 10, "en");

        // Original cached DTO hala TR title'a sahip
        assertEquals("Tr başlık", cached.getTitle());
    }

    @Test
    void getArticleContent_en_translatedSuccess_cachesAndReturns() {
        org.springframework.data.redis.core.ValueOperations<String, String> ops =
                org.mockito.Mockito.mock(org.springframework.data.redis.core.ValueOperations.class);
        when(stringRedisTemplate.opsForValue()).thenReturn(ops);
        when(ops.get(org.mockito.ArgumentMatchers.anyString())).thenReturn(null);
        when(scraperClient.scrapeArticleContent("http://x")).thenReturn("Türkçe içerik");
        when(translationClient.translate("Türkçe içerik", "tr", "en")).thenReturn("English content");

        String result = service.getArticleContent("http://x", "en");

        assertEquals("English content", result);
        org.mockito.Mockito.verify(ops).set(org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq("English content"),
                org.mockito.ArgumentMatchers.any(java.time.Duration.class));
    }

    @Test
    void getArticleContent_en_cacheHit_returnsCachedWithoutTranslate() {
        org.springframework.data.redis.core.ValueOperations<String, String> ops =
                org.mockito.Mockito.mock(org.springframework.data.redis.core.ValueOperations.class);
        when(stringRedisTemplate.opsForValue()).thenReturn(ops);
        when(scraperClient.scrapeArticleContent("http://x")).thenReturn("Türkçe");
        when(ops.get(org.mockito.ArgumentMatchers.anyString())).thenReturn("Cached EN content");

        String result = service.getArticleContent("http://x", "en");

        assertEquals("Cached EN content", result);
        org.mockito.Mockito.verify(translationClient, org.mockito.Mockito.never())
                .translate(org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void getArticleContent_en_translateFails_returnsTrFallback() {
        org.springframework.data.redis.core.ValueOperations<String, String> ops =
                org.mockito.Mockito.mock(org.springframework.data.redis.core.ValueOperations.class);
        when(stringRedisTemplate.opsForValue()).thenReturn(ops);
        when(ops.get(org.mockito.ArgumentMatchers.anyString())).thenReturn(null);
        when(scraperClient.scrapeArticleContent("http://x")).thenReturn("Türkçe içerik");
        when(translationClient.translate(org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(null);

        String result = service.getArticleContent("http://x", "en");

        assertEquals("Türkçe içerik", result);
    }

    @Test
    void getArticleContent_en_trContentBlank_skipsTranslate() {
        when(scraperClient.scrapeArticleContent("http://x")).thenReturn("");

        String result = service.getArticleContent("http://x", "en");

        assertEquals("", result);
        org.mockito.Mockito.verify(translationClient, org.mockito.Mockito.never())
                .translate(org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void getArticleContent_trLang_skipsTranslateEntirely() {
        when(scraperClient.scrapeArticleContent("http://x")).thenReturn("Türkçe");

        String result = service.getArticleContent("http://x", "tr");

        assertEquals("Türkçe", result);
        org.mockito.Mockito.verify(translationClient, org.mockito.Mockito.never())
                .translate(org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.anyString());
    }
}
