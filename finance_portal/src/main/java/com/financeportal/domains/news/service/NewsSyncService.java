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

    // Bumped to v15 — Dünya Gazetesi (genel feed) kaldırıldı, yerine AA Ekonomi (kategori-spesifik) geldi.
    protected static final String REDIS_KEY = "cache:news:v15";
    private final RedisTemplate<String, Object> redisTemplate;
    private final RssIntegrationClient rssIntegrationClient;
    private final ObjectMapper objectMapper;
    private final NewsCategoryClassifier categoryClassifier;

    // Açık kaynak RSS 2.0 feed'leri (Atom feed'ler client'ımızda parse edilemiyor).
    // Map.ofEntries — Map.of() 10 entry sınırı için.
    private static final Map<String, String> SOURCES = Map.ofEntries(
            Map.entry("https://www.bloomberght.com/rss", "Bloomberg HT"),
            Map.entry("https://www.trthaber.com/ekonomi_articles.rss", "TRT Haber Ekonomi"),
            Map.entry("https://uzmancoin.com/feed/", "Uzmancoin"),
            Map.entry("https://coin-turk.com/feed", "CoinTurk"),
            Map.entry("https://www.aa.com.tr/tr/rss/default?cat=ekonomi", "Anadolu Ajansı Ekonomi"),
            Map.entry("https://www.hurriyet.com.tr/rss/ekonomi", "Hürriyet Ekonomi"),
            Map.entry("https://www.haberturk.com/rss/kategori/ekonomi.xml", "Habertürk Ekonomi"),
            Map.entry("https://www.sabah.com.tr/rss/ekonomi.xml", "Sabah Ekonomi")
    );

    // initialDelay=5sn → startup'tan 5 saniye sonra ilk fetch, sonra 15dk'da bir.
    @Scheduled(initialDelay = 5000, fixedRate = 900000)
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