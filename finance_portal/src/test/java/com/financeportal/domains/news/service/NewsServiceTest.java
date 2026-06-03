package com.financeportal.domains.news.service;

import com.financeportal.domains.news.client.NewsScraperClient;
import com.financeportal.domains.news.dto.NewsDto;
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
    @Mock private com.financeportal.domains.news.client.TranslationClient translationClient;
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

        Map<String, Object> result = service.getPagedNews("Tümü", 0, 10);

        assertEquals(3, ((List<?>) result.get("content")).size());
        assertFalse((Boolean) result.get("hasNext"));
    }

    @Test
    void getPagedNews_specificCategory_filtersMatching() {
        when(syncService.getCachedNews()).thenReturn(List.of(
                news("T1", "Kripto"), news("T2", "Borsa"), news("T3", "Kripto")));

        Map<String, Object> result = service.getPagedNews("Kripto", 0, 10);

        assertEquals(2, ((List<?>) result.get("content")).size());
    }

    @Test
    void getPagedNews_caseInsensitiveCategory() {
        when(syncService.getCachedNews()).thenReturn(List.of(
                news("T1", "Kripto"), news("T2", "KRIPTO")));

        Map<String, Object> result = service.getPagedNews("kripto", 0, 10);

        assertEquals(2, ((List<?>) result.get("content")).size());
    }

    @Test
    void getPagedNews_pagination_returnsCorrectSlice() {
        List<NewsDto> all = new java.util.ArrayList<>();
        for (int i = 0; i < 20; i++) all.add(news("T" + i, "Tümü"));
        when(syncService.getCachedNews()).thenReturn(all);

        Map<String, Object> result = service.getPagedNews("Tümü", 0, 5);

        assertEquals(5, ((List<?>) result.get("content")).size());
        assertTrue((Boolean) result.get("hasNext")); // 20 > 5, more to come
    }

    @Test
    void getPagedNews_lastPage_hasNextFalse() {
        List<NewsDto> all = new java.util.ArrayList<>();
        for (int i = 0; i < 12; i++) all.add(news("T" + i, "Tümü"));
        when(syncService.getCachedNews()).thenReturn(all);

        Map<String, Object> result = service.getPagedNews("Tümü", 2, 5);

        // page 2, size 5 → items 10-12 (2 items)
        assertEquals(2, ((List<?>) result.get("content")).size());
        assertFalse((Boolean) result.get("hasNext"));
    }

    @Test
    void getPagedNews_pageOutOfRange_returnsEmpty() {
        when(syncService.getCachedNews()).thenReturn(List.of(
                news("T1", "Tümü"), news("T2", "Tümü")));

        Map<String, Object> result = service.getPagedNews("Tümü", 10, 5);

        assertTrue(((List<?>) result.get("content")).isEmpty());
        assertFalse((Boolean) result.get("hasNext"));
    }

    @Test
    void getPagedNews_emptyNewsList_returnsEmpty() {
        when(syncService.getCachedNews()).thenReturn(List.of());

        Map<String, Object> result = service.getPagedNews("Tümü", 0, 10);

        assertTrue(((List<?>) result.get("content")).isEmpty());
    }

    @Test
    void getArticleContent_delegatesToScraper() {
        when(scraperClient.scrapeArticleContent("http://test.com")).thenReturn("Article body");

        assertEquals("Article body", service.getArticleContent("http://test.com"));
    }

    @Test
    void getEconomicCalendar_delegatesToScraper() {
        Map<String, String> event = Map.of("country", "US", "event", "CPI");
        when(scraperClient.scrapeEconomicCalendar()).thenReturn(List.of(event));

        List<Map<String, String>> result = service.getEconomicCalendar();
        assertEquals(1, result.size());
        assertEquals("US", result.get(0).get("country"));
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

        Map<String, Object> result = service.getPagedNews("Tümü", 0, 10, "en");

        List<?> content = (List<?>) result.get("content");
        assertEquals(1, content.size());
        NewsDto dto = (NewsDto) content.get(0);
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

        Map<String, Object> result = service.getPagedNews("Tümü", 0, 10, "en");

        NewsDto dto = (NewsDto) ((List<?>) result.get("content")).get(0);
        assertEquals("Borsa yükseldi", dto.getTitle());
        assertEquals("desc", dto.getDescription());
        // Category from classifier mapping (Borsa → Stocks) since categoryEn null
        assertEquals("Stocks", dto.getCategory());
    }

    @Test
    void getPagedNews_en_AllCategoryWorks() {
        when(syncService.getCachedNews()).thenReturn(List.of(
                news("T1", "Kripto"), news("T2", "Borsa")));
        Map<String, Object> result = service.getPagedNews("All", 0, 10, "en");
        assertEquals(2, ((List<?>) result.get("content")).size());
    }

    @Test
    void getPagedNews_en_filterByEnglishCategory_matchesTrCache() {
        NewsDto n = news("Bitcoin", "Kripto");
        n.setTitleEn("Bitcoin");
        when(syncService.getCachedNews()).thenReturn(List.of(n, news("Borsa", "Borsa")));

        Map<String, Object> result = service.getPagedNews("Crypto", 0, 10, "en");

        assertEquals(1, ((List<?>) result.get("content")).size());
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
        when(translationClient.translate(org.mockito.ArgumentMatchers.eq("Türkçe içerik"),
                org.mockito.ArgumentMatchers.eq("tr"), org.mockito.ArgumentMatchers.eq("en")))
                .thenReturn("English content");

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
