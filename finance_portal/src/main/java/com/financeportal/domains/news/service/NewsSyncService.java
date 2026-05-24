package com.financeportal.domains.news.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.news.client.RssIntegrationClient;
import com.financeportal.domains.news.dto.NewsDto;
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
public class NewsSyncService {

    protected static final String REDIS_KEY = "cache:news:v13";
    private final RedisTemplate<String, Object> redisTemplate;
    private final RssIntegrationClient rssIntegrationClient;
    private final ObjectMapper objectMapper;
    private final NewsCategoryClassifier categoryClassifier;

    private static final Map<String, String> SOURCES = Map.of(
            "https://www.bloomberght.com/rss", "Bloomberg HT",
            "https://www.trthaber.com/ekonomi_articles.rss", "TRT Haber Ekonomi",
            "https://uzmancoin.com/feed/", "Uzmancoin"
    );

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
                        news.setCategory(categoryClassifier.assignCategory(news.getTitle(), news.getDescription()));
                        masterList.add(news);
                        processedLinks.add(news.getLink());
                        newlyAddedCount++;
                    }
                }
            } catch (Exception e) {
                log.error("[NEWS_SYNC] Error processing source {}: {}", entry.getValue(), e.getMessage());
            }
        }

        if (masterList.size() > initialSize) {
            masterList.sort((a, b) -> b.getPubDate().compareTo(a.getPubDate()));

            try {
                String jsonStr = objectMapper.writeValueAsString(masterList);
                redisTemplate.opsForValue().set(REDIS_KEY, jsonStr, Duration.ofDays(7));
                log.info("[NEWS_SYNC] Updated news cache. Added {} articles. Total: {}. Time: {} ms.", newlyAddedCount, masterList.size(), (System.currentTimeMillis() - startTime));
            } catch (Exception e) {
                log.error("Haberleri cache'e yazarken hata:", e);
            }
        }
    }

    protected List<NewsDto> getCachedNews() {
        try {
            Object cached = redisTemplate.opsForValue().get(REDIS_KEY);
            if (cached instanceof String jsonStr) {
                return objectMapper.readValue(jsonStr, new TypeReference<List<NewsDto>>() {});
            }
        } catch (Exception e) {
            log.error("Haberleri cache'ten okurken hata:", e);
        }
        return new ArrayList<>();
    }
}