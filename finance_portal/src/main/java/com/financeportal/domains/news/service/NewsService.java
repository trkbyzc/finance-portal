package com.financeportal.domains.news.service;

import com.financeportal.domains.news.client.NewsScraperClient;
import com.financeportal.domains.news.dto.NewsDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class NewsService {

    private final NewsSyncService newsSyncService;
    private final NewsScraperClient newsScraperClient;

    public Map<String, Object> getPagedNews(String category, int page, int size) {
        long startTime = System.currentTimeMillis();

        List<NewsDto> allNews = newsSyncService.getCachedNews();

        List<NewsDto> filtered = allNews.stream()
                .filter(n -> "Tümü".equals(category) || n.getCategory().equalsIgnoreCase(category))
                .toList();

        int start = page * size;
        int end = Math.min(start + size, filtered.size());

        List<NewsDto> content = start < filtered.size() ? filtered.subList(start, end) : List.of();

        log.debug("[NEWS_SERVICE] Served {} news items for category '{}' (Page: {}) in {} ms.", content.size(), category, page, (System.currentTimeMillis() - startTime));

        return Map.of(
                "content", content,
                "hasNext", end < filtered.size()
        );
    }

    public String getArticleContent(String url) {
        log.debug("[NEWS_SERVICE] Requesting full article content for URL: {}", url);
        return newsScraperClient.scrapeArticleContent(url);
    }

    public List<Map<String, String>> getEconomicCalendar() {
        log.debug("[NEWS_SERVICE] Requesting economic calendar data.");
        return newsScraperClient.scrapeEconomicCalendar();
    }
}