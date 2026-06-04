package com.financeportal.domains.news.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.news.client.RssIntegrationClient;
import com.financeportal.domains.news.client.TranslationClient;
import com.financeportal.domains.news.dto.NewsDto;
import com.financeportal.service.bootstrap.BootstrapReadinessTracker;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class NewsSyncService {

    // Bumped to v16 — NewsEntityTagger ilgili-varlık etiketleri eklendi; cache yeniden kurulup
    // tüm haberler etiketlensin diye key bump'landı.
    protected static final String REDIS_KEY = "cache:news:v16";
    private final RedisTemplate<String, Object> redisTemplate;
    private final RssIntegrationClient rssIntegrationClient;
    private final ObjectMapper objectMapper;
    private final NewsCategoryClassifier categoryClassifier;
    private final NewsEntityTagger newsEntityTagger;
    private final BootstrapReadinessTracker bootstrapTracker;
    private final TranslationClient translationClient;

    private static final String TASK_NAME = "News";
    /** Bir sync turunda en fazla bu kadar haberi translate'le — sync süresini sınırla.
     *  Geri kalanlar bir sonraki turda (cache'de zaten varsa atlanır). */
    private static final int MAX_TRANSLATIONS_PER_RUN = 60;

    @PostConstruct
    void registerBootstrap() { bootstrapTracker.register(TASK_NAME); }

    // Açık kaynak RSS 2.0 feed'leri (Atom feed'ler client'ımızda parse edilemiyor).
    // Map.ofEntries — Map.of() 10 entry sınırı için.
    // Bloomberg HT kaldırıldı: RSS items'lerin %75'inde description boş/literal "[]" geliyor,
    // dolanlar için ise scraper detail content çekemiyor → "Haberin detaylarına ulaşılamadı" görünüyordu.
    private static final Map<String, String> SOURCES = Map.ofEntries(
            Map.entry("https://www.trthaber.com/ekonomi_articles.rss", "TRT Haber Ekonomi"),
            Map.entry("https://uzmancoin.com/feed/", "Uzmancoin"),
            Map.entry("https://coin-turk.com/feed", "CoinTurk"),
            Map.entry("https://www.aa.com.tr/tr/rss/default?cat=ekonomi", "Anadolu Ajansı Ekonomi"),
            Map.entry("https://www.hurriyet.com.tr/rss/ekonomi", "Hürriyet Ekonomi"),
            Map.entry("https://www.haberturk.com/rss/kategori/ekonomi.xml", "Habertürk Ekonomi"),
            Map.entry("https://www.sabah.com.tr/rss/ekonomi.xml", "Sabah Ekonomi")
    );

    /**
     * Startup'ta LibreTranslate hazır olunca otomatik ilk sync — restart edince
     * her seferinde manuel "POST /api/news/sync" çağırmaya gerek kalmaz.
     * Container ilk açılışta model'i indirebilir (~30-60sn) → max 3 dk poll'la bekleriz.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void syncOnStartupWhenTranslationReady() {
        CompletableFuture.runAsync(() -> {
            log.info("[NEWS_SYNC] Startup: LibreTranslate hazır olması bekleniyor (max 3dk)...");
            int maxAttempts = 36; // 36 × 5sn = 3dk
            for (int i = 0; i < maxAttempts; i++) {
                if (translationClient.isAvailable()) {
                    log.info("[NEWS_SYNC] LibreTranslate hazır, ilk sync başlatılıyor.");
                    try {
                        fetchAndCacheNews();
                    } catch (Exception e) {
                        log.error("[NEWS_SYNC] Startup sync hatası: {}", e.getMessage());
                    }
                    return;
                }
                try { Thread.sleep(5000); }
                catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
            }
            // Yine de bir RSS-only sync yapalım — çevirisiz haberler frontend'de TR olarak görünür,
            // sonraki 15-dk zamanlı sync'lerde LibreTranslate ayağa kalkmışsa çevrilirler.
            log.warn("[NEWS_SYNC] LibreTranslate 3dk içinde hazır olmadı, RSS-only sync yapılıyor.");
            try { fetchAndCacheNews(); } catch (Exception ignored) { /* zamanlı sync devralır */ }
        });
    }

    /** Zamanlı sync — startup'taki ilk run'dan sonra her 15dk'da bir.
     *  initialDelay yok: syncOnStartupWhenTranslationReady() ilk run'u zaten halletti. */
    @Scheduled(fixedDelay = 900000, initialDelay = 900000)
    public void fetchAndCacheNews() {
        try {
            long startTime = System.currentTimeMillis();
            List<NewsDto> masterList = getCachedNews();
            Set<String> processedLinks = masterList.stream().map(NewsDto::getLink).collect(Collectors.toSet());

            int newlyAddedCount = addFreshArticles(masterList, processedLinks);
            int purgedCount = purgeStaleArticles(masterList);
            if (newlyAddedCount > 0 || purgedCount > 0) {
                masterList.sort((a, b) -> b.getPubDate().compareTo(a.getPubDate()));
            }
            int translatedCount = translatePendingNews(masterList);
            persistIfChanged(masterList, newlyAddedCount, translatedCount, purgedCount, startTime);
        } finally {
            bootstrapTracker.markComplete(TASK_NAME);
        }
    }

    /** Tüm RSS kaynaklarını dolaşıp yeni description'lı item'ları masterList'e ekler. */
    private int addFreshArticles(List<NewsDto> masterList, Set<String> processedLinks) {
        int addedCount = 0;
        for (Map.Entry<String, String> entry : SOURCES.entrySet()) {
            addedCount += fetchFromSourceSafely(entry.getKey(), entry.getValue(), masterList, processedLinks);
        }
        return addedCount;
    }

    /** Tek kaynak için RSS çek + filtre + dedupe; hata olursa log'la 0 dön. */
    private int fetchFromSourceSafely(String url, String sourceName, List<NewsDto> masterList, Set<String> processedLinks) {
        try {
            List<NewsDto> fetched = rssIntegrationClient.fetchNewsFromSource(url, sourceName);
            int added = 0;
            for (NewsDto news : fetched) {
                if (acceptArticle(news, processedLinks)) {
                    news.setCategory(categoryClassifier.assignCategory(news.getTitle(), news.getDescription()));
                    newsEntityTagger.tag(news); // ilgili varlık etiketi (relatedSymbol/name/category)
                    masterList.add(news);
                    processedLinks.add(news.getLink());
                    added++;
                }
            }
            return added;
        } catch (Exception e) {
            log.error("[NEWS_SYNC] Error processing source {}: {}", sourceName, e.getMessage());
            return 0;
        }
    }

    /** Item kabul kriteri: kullanılabilir description + henüz işlenmemiş link. */
    private boolean acceptArticle(NewsDto news, Set<String> processedLinks) {
        return hasUsableDescription(news.getDescription()) && !processedLinks.contains(news.getLink());
    }

    /** Eski cache'te kalmış boş/garbage description'lı VEYA artık desteklenmeyen kaynaktan gelen item'ları temizler. */
    private int purgeStaleArticles(List<NewsDto> masterList) {
        Set<String> allowedSources = new HashSet<>(SOURCES.values());
        int beforePurge = masterList.size();
        masterList.removeIf(n -> !hasUsableDescription(n.getDescription())
                || (n.getSource() != null && !allowedSources.contains(n.getSource())));
        int purgedCount = beforePurge - masterList.size();
        if (purgedCount > 0) {
            log.info("[NEWS_SYNC] {} boş/garbage description'lı eski haber cache'ten temizlendi.", purgedCount);
        }
        return purgedCount;
    }

    /** Değişiklik varsa cache'e yaz, yoksa atla. */
    private void persistIfChanged(List<NewsDto> masterList, int newlyAdded, int translated, int purged, long startTime) {
        if (newlyAdded == 0 && translated == 0 && purged == 0) return;
        try {
            String jsonStr = objectMapper.writeValueAsString(masterList);
            redisTemplate.opsForValue().set(REDIS_KEY, jsonStr, Duration.ofDays(7));
            log.info("[NEWS_SYNC] Updated news cache. Added {} articles, translated {}. Total: {}. Time: {} ms.",
                    newlyAdded, translated, masterList.size(), (System.currentTimeMillis() - startTime));
        } catch (Exception e) {
            log.error("Haberleri cache'e yazarken hata:", e);
        }
    }

    /**
     * Description'ın frontend'de gösterilebilir gerçek metin olup olmadığını kontrol eder.
     * Boş, sadece whitespace, veya RSS feed'in literal "[]" / "[ ]" / "null" gibi placeholder'ları
     * "kullanılamaz" sayılır — bu item'lar sync sırasında atlanır.
     */
    static boolean hasUsableDescription(String description) {
        if (description == null) return false;
        String trimmed = description.trim();
        // Boş, sadece whitespace, literal "[]" placeholder (Bloomberg HT <![CDATA[[]]]> formu), veya "null"
        // → frontend'de "başlık+resim ama içerik yok" görünmesin diye atılır.
        return !trimmed.isEmpty()
                && !"[]".equals(trimmed)
                && !"[ ]".equals(trimmed)
                && !"null".equalsIgnoreCase(trimmed);
    }

    /**
     * titleEn null olan haberleri sırayla LibreTranslate'e gönderir; tur başına en fazla
     * MAX_TRANSLATIONS_PER_RUN çeviri yapılır. LibreTranslate kapalıysa erken çıkar (0 döner).
     * Kategoriyi ayrı çevirmiyoruz — NewsCategoryClassifier.localize() ile yapılıyor.
     */
    protected int translatePendingNews(List<NewsDto> newsList) {
        if (!translationClient.isAvailable()) {
            log.debug("[NEWS_SYNC] LibreTranslate hazır değil, çeviri atlandı.");
            return 0;
        }
        int translated = 0;
        // Tek break: cap'e ulaşınca çık. continue yerine nested if'lerle akışı yönetiyoruz
        // (S135: tur başına en fazla 1 break/continue önerisi).
        for (NewsDto news : newsList) {
            if (translated >= MAX_TRANSLATIONS_PER_RUN) break;
            if (news.getTitleEn() == null && translateOne(news)) {
                translated++;
            }
        }
        return translated;
    }

    /** Tek haberi çevirip alanlarını set'ler. En az bir alan çevrilebildiyse true. */
    private boolean translateOne(NewsDto news) {
        String titleEn = translationClient.translate(news.getTitle(), "tr", "en");
        String descEn = translationClient.translate(news.getDescription(), "tr", "en");
        if (titleEn == null && descEn == null) return false;
        news.setTitleEn(titleEn);
        news.setDescriptionEn(descEn);
        news.setCategoryEn(NewsCategoryClassifier.localize(news.getCategory(), "en"));
        return true;
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