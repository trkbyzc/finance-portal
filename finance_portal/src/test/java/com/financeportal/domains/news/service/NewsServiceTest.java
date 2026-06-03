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
}
