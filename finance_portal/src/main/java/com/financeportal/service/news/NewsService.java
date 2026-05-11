package com.financeportal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.client.NewsScraperClient;
import com.financeportal.client.RssIntegrationClient;
import com.financeportal.model.dto.news.NewsDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class NewsService {

    private static final String REDIS_KEY = "cache:news:v12";
    private final RedisTemplate<String, Object> redisTemplate;

    // DEPENDENCIES
    private final RssIntegrationClient rssIntegrationClient;
    private final NewsScraperClient newsScraperClient;
    private final ObjectMapper objectMapper;

    private static final Map<String, String> SOURCES = Map.of(
            "https://www.bloomberght.com/rss", "Bloomberg HT",
            "https://www.trthaber.com/ekonomi_articles.rss", "TRT Haber Ekonomi",
            "https://uzmancoin.com/feed/", "Uzmancoin"
    );

    // ==========================================
    // 1. FETCH AND CACHE NEWS (Orchestration)
    // ==========================================
    @Scheduled(fixedRate = 900000)
    public void fetchAndCacheNews() {
        long startTime = System.currentTimeMillis();
        List<NewsDto> masterList = getCachedNews();
        Set<String> processedLinks = masterList.stream().map(NewsDto::getLink).collect(Collectors.toSet());
        int initialSize = masterList.size();
        int newlyAddedCount = 0;

        for (Map.Entry<String, String> entry : SOURCES.entrySet()) {
            try {
                List<NewsDto> fetchedNews = rssIntegrationClient.fetchNewsFromSource(entry.getKey(), entry.getValue());

                for (NewsDto news : fetchedNews) {
                    if (!processedLinks.contains(news.getLink())) {
                        news.setCategory(smartCategoryAssign(news.getTitle(), news.getDescription()));
                        masterList.add(news);
                        processedLinks.add(news.getLink());
                        newlyAddedCount++;
                    }
                }
            } catch (Exception e) {
                log.error("[NEWS_SERVICE] Error processing source {}: {}", entry.getValue(), e.getMessage());
            }
        }

        if (masterList.size() > initialSize) {
            masterList.sort((a, b) -> b.getPubDate().compareTo(a.getPubDate()));
            redisTemplate.opsForValue().set(REDIS_KEY, masterList, Duration.ofDays(7));
            log.info("[NEWS_SERVICE] Successfully updated news cache. Added {} new articles. Total pool: {}. Execution time: {} ms.", newlyAddedCount, masterList.size(), (System.currentTimeMillis() - startTime));
        } else {
            log.debug("[NEWS_SERVICE] No new articles found. Total pool remains: {}. Execution time: {} ms.", masterList.size(), (System.currentTimeMillis() - startTime));
        }
    }

    // ==========================================
    // 2. PAGINATED NEWS RETRIEVAL
    // ==========================================
    public Map<String, Object> getPagedNews(String category, int page, int size) {
        long startTime = System.currentTimeMillis();
        List<NewsDto> allNews = getCachedNews();
        List<NewsDto> filtered = allNews.stream()
                .filter(n -> category.equals("Tümü") || n.getCategory().equalsIgnoreCase(category))
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

    // ==========================================
    // 3. FULL ARTICLE CONTENT RETRIEVAL
    // ==========================================
    public String getArticleContent(String url) {
        log.debug("[NEWS_SERVICE] Requesting full article content for URL: {}", url);
        return newsScraperClient.scrapeArticleContent(url);
    }

    // ==========================================
    // 4. ECONOMIC CALENDAR RETRIEVAL
    // ==========================================
    public List<Map<String, String>> getEconomicCalendar() {
        log.debug("[NEWS_SERVICE] Requesting economic calendar data.");
        return newsScraperClient.scrapeEconomicCalendar();
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================
    private List<NewsDto> getCachedNews() {
        Object cached = redisTemplate.opsForValue().get(REDIS_KEY);

        if (cached instanceof List<?> rawList) {
            return rawList.stream()
                    .map(item -> objectMapper.convertValue(item, NewsDto.class))
                    .collect(Collectors.toList());
        }

        return new ArrayList<>();
    }

    private String smartCategoryAssign(String title, String desc) {
        String text = (title + " " + desc).toLowerCase(new Locale("tr", "TR"));
        if (text.contains("bitcoin") || text.contains("kripto") || text.contains("coin") || text.contains("ethereum")) return "Kripto";
        if (text.contains("borsa") || text.contains("hisse") || text.contains("bist")) return "Hisse Senetleri";
        if (text.contains("dolar") || text.contains("euro") || text.contains("faiz") || text.contains("tcmb")) return "Döviz Kurları";
        if (text.contains("altın") || text.contains("petrol") || text.contains("emtia")) return "Emtialar";
        if (text.contains("fon") || text.contains("tefas") || text.contains("portföy")) return "Yatırım Fonları";
        return "Genel Ekonomi";
    }
}