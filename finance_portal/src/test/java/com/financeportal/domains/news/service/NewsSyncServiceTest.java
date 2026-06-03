package com.financeportal.domains.news.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financeportal.domains.news.client.RssIntegrationClient;
import com.financeportal.domains.news.dto.NewsDto;
import com.financeportal.service.bootstrap.BootstrapReadinessTracker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings("unchecked")
class NewsSyncServiceTest {

    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private ValueOperations<String, Object> valueOps;
    @Mock private RssIntegrationClient rssClient;
    @Mock private NewsCategoryClassifier categoryClassifier;
    @Mock private BootstrapReadinessTracker bootstrapTracker;
    @Mock private com.financeportal.domains.news.client.TranslationClient translationClient;

    private ObjectMapper objectMapper;

    @InjectMocks private NewsSyncService service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new NewsSyncService(redisTemplate, rssClient, objectMapper, categoryClassifier, bootstrapTracker, translationClient);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        // Translation kapalı varsayılıyor — testler eski davranışı koruyor (sadece RSS path).
        when(translationClient.isAvailable()).thenReturn(false);
    }

    private NewsDto news(String link, String title, String desc, String pubDate) {
        NewsDto n = new NewsDto();
        n.setLink(link);
        n.setTitle(title);
        n.setDescription(desc);
        n.setPubDate(pubDate);
        // Allowed sources içinden bir tanesi — purge filter (yasaklı kaynak) tetiklenmesin.
        n.setSource("TRT Haber Ekonomi");
        return n;
    }

    // -------- fetchAndCacheNews --------

    @Test
    void fetch_emptyCache_fetchesAllSourcesAndCaches() {
        when(valueOps.get("cache:news:v15")).thenReturn(null);
        when(rssClient.fetchNewsFromSource(anyString(), anyString()))
                .thenReturn(List.of(news("http://link1", "Title1", "Desc1", "2026-06-01")));
        when(categoryClassifier.assignCategory(anyString(), anyString())).thenReturn("Genel");

        service.fetchAndCacheNews();

        verify(rssClient, atLeastOnce()).fetchNewsFromSource(anyString(), anyString());
        verify(valueOps).set(eq("cache:news:v15"), any(), eq(Duration.ofDays(7)));
        verify(bootstrapTracker).markComplete("News");
    }

    @Test
    void fetch_existingCachedNews_dedupesByLink() throws Exception {
        // Cache already has 1 article
        NewsDto existing = news("http://existing", "Existing", "desc", "2026-06-01");
        String cachedJson = objectMapper.writeValueAsString(List.of(existing));
        when(valueOps.get("cache:news:v15")).thenReturn(cachedJson);

        // RSS returns 2 articles: 1 duplicate + 1 new
        NewsDto duplicate = news("http://existing", "Existing dup", "desc", "2026-06-01");
        NewsDto newArticle = news("http://new", "New", "desc", "2026-06-02");
        when(rssClient.fetchNewsFromSource(anyString(), anyString()))
                .thenReturn(List.of(duplicate, newArticle), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
        when(categoryClassifier.assignCategory(anyString(), anyString())).thenReturn("Genel");

        service.fetchAndCacheNews();

        ArgumentCaptor<Object> cap = ArgumentCaptor.forClass(Object.class);
        verify(valueOps).set(eq("cache:news:v15"), cap.capture(), any(Duration.class));
        String savedJson = (String) cap.getValue();
        // Both existing and new article saved, deduped
        assertTrue(savedJson.contains("http://existing"));
        assertTrue(savedJson.contains("http://new"));
    }

    @Test
    void fetch_noNewArticles_doesNotWriteCache() throws Exception {
        // Cache has same article RSS returns
        NewsDto existing = news("http://link1", "T", "D", "2026-06-01");
        String cachedJson = objectMapper.writeValueAsString(List.of(existing));
        when(valueOps.get("cache:news:v15")).thenReturn(cachedJson);

        // RSS returns same article
        when(rssClient.fetchNewsFromSource(anyString(), anyString()))
                .thenReturn(List.of(existing));

        service.fetchAndCacheNews();

        // No new articles → don't update cache
        verify(valueOps, never()).set(anyString(), any(), any(Duration.class));
    }

    @Test
    void fetch_sourceThrows_continuesToNext() {
        when(valueOps.get("cache:news:v15")).thenReturn(null);
        when(rssClient.fetchNewsFromSource(anyString(), anyString()))
                .thenThrow(new RuntimeException("bloomberg down"))
                .thenReturn(List.of(news("http://link", "T", "D", "2026-06-01")));
        when(categoryClassifier.assignCategory(anyString(), anyString())).thenReturn("Genel");

        service.fetchAndCacheNews();

        // Failure on first source, second succeeds → cache still updated
        verify(valueOps).set(eq("cache:news:v15"), any(), any(Duration.class));
        verify(bootstrapTracker).markComplete("News");
    }

    @Test
    void fetch_articleCategoryAssigned_byClassifier() {
        when(valueOps.get("cache:news:v15")).thenReturn(null);
        NewsDto article = news("http://link1", "Bitcoin rise", "BTC up", "2026-06-01");
        when(rssClient.fetchNewsFromSource(anyString(), anyString()))
                .thenReturn(List.of(article));
        when(categoryClassifier.assignCategory("Bitcoin rise", "BTC up")).thenReturn("Kripto");

        service.fetchAndCacheNews();

        // Article got category from classifier
        verify(categoryClassifier).assignCategory("Bitcoin rise", "BTC up");
    }

    @Test
    void fetch_sortedByPubDateDescending() {
        when(valueOps.get("cache:news:v15")).thenReturn(null);
        NewsDto older = news("http://older", "Older", "D", "2026-06-01T08:00:00+03:00");
        NewsDto newer = news("http://newer", "Newer", "D", "2026-06-01T20:00:00+03:00");
        // Return both in arbitrary order
        when(rssClient.fetchNewsFromSource(anyString(), anyString()))
                .thenReturn(List.of(older, newer), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
        when(categoryClassifier.assignCategory(anyString(), anyString())).thenReturn("Genel");

        service.fetchAndCacheNews();

        ArgumentCaptor<Object> cap = ArgumentCaptor.forClass(Object.class);
        verify(valueOps).set(eq("cache:news:v15"), cap.capture(), any(Duration.class));
        String savedJson = (String) cap.getValue();
        // newer should come first
        int newerIdx = savedJson.indexOf("http://newer");
        int olderIdx = savedJson.indexOf("http://older");
        assertTrue(newerIdx < olderIdx, "Sorted descending: newer first");
    }

    @Test
    void fetch_alwaysMarksBootstrapComplete_evenOnFailure() {
        when(valueOps.get("cache:news:v15")).thenThrow(new RuntimeException("redis down"));

        // Should not throw
        service.fetchAndCacheNews();

        verify(bootstrapTracker).markComplete("News");
    }

    @Test
    void getCachedNews_invalidJson_returnsEmpty() {
        when(valueOps.get("cache:news:v15")).thenReturn("garbage");

        when(rssClient.fetchNewsFromSource(anyString(), anyString())).thenReturn(List.of());
        service.fetchAndCacheNews();

        // Cache read failed but doesn't propagate
        verify(bootstrapTracker).markComplete("News");
    }

    @Test
    void getCachedNews_nonStringCached_returnsEmpty() {
        // Cache has wrong type (e.g., List)
        when(valueOps.get("cache:news:v15")).thenReturn(List.of("not a json string"));

        when(rssClient.fetchNewsFromSource(anyString(), anyString())).thenReturn(List.of());
        service.fetchAndCacheNews();

        verify(bootstrapTracker).markComplete("News");
    }

    // -------- translatePendingNews --------

    @Test
    void translatePendingNews_serviceUnavailable_returnsZero() {
        when(translationClient.isAvailable()).thenReturn(false);

        java.util.List<NewsDto> input = new java.util.ArrayList<>();
        input.add(news("http://x", "Borsa", "İçerik", "2026-06-01"));

        int translated = service.translatePendingNews(input);

        assertEquals(0, translated);
        assertNull(input.get(0).getTitleEn());
    }

    @Test
    void translatePendingNews_alreadyTranslated_skipped() {
        when(translationClient.isAvailable()).thenReturn(true);
        NewsDto already = news("http://x", "Borsa", "İçerik", "2026-06-01");
        already.setTitleEn("Already translated");

        int translated = service.translatePendingNews(java.util.List.of(already));

        assertEquals(0, translated);
        verify(translationClient, org.mockito.Mockito.never())
                .translate(anyString(), anyString(), anyString());
    }

    @Test
    void translatePendingNews_translatesAndSetsFields() {
        when(translationClient.isAvailable()).thenReturn(true);
        NewsDto fresh = news("http://x", "Borsa yükseldi", "Bist 100 rekor", "2026-06-01");
        fresh.setCategory("Borsa");
        when(translationClient.translate("Borsa yükseldi", "tr", "en")).thenReturn("Stock market rose");
        when(translationClient.translate("Bist 100 rekor", "tr", "en")).thenReturn("BIST 100 record");

        int translated = service.translatePendingNews(java.util.List.of(fresh));

        assertEquals(1, translated);
        assertEquals("Stock market rose", fresh.getTitleEn());
        assertEquals("BIST 100 record", fresh.getDescriptionEn());
        assertEquals("Stocks", fresh.getCategoryEn());
    }

    @Test
    void translatePendingNews_bothNull_doesNotMarkAsTranslated() {
        when(translationClient.isAvailable()).thenReturn(true);
        NewsDto fresh = news("http://x", "T", "D", "2026-06-01");
        when(translationClient.translate(anyString(), anyString(), anyString())).thenReturn(null);

        int translated = service.translatePendingNews(java.util.List.of(fresh));

        assertEquals(0, translated);
        assertNull(fresh.getTitleEn());
    }

    // -------- hasUsableDescription filter --------

    @org.junit.jupiter.params.ParameterizedTest(name = "desc=[{0}] → unusable")
    @org.junit.jupiter.params.provider.NullSource
    @org.junit.jupiter.params.provider.ValueSource(strings = {"", "   ", "[]", "[ ]", "null", "NULL"})
    void hasUsableDescription_unusableInputs_returnFalse(String desc) {
        assertFalse(NewsSyncService.hasUsableDescription(desc));
    }

    @Test
    void hasUsableDescription_realText_returnsTrue() {
        assertTrue(NewsSyncService.hasUsableDescription("ABD hizmet sektörü Mayıs ayında toparlandı."));
    }

    @Test
    void fetch_disallowedSourceInCache_purged() throws Exception {
        // Cache'te eski Bloomberg HT haberi var (artık SOURCES listesinde yok).
        NewsDto bloomberg = new NewsDto();
        bloomberg.setLink("http://bloomberg/old");
        bloomberg.setTitle("Eski Bloomberg");
        bloomberg.setDescription("Real description");
        bloomberg.setPubDate("2026-06-01");
        bloomberg.setSource("Bloomberg HT");

        NewsDto trtAllowed = new NewsDto();
        trtAllowed.setLink("http://trt/new");
        trtAllowed.setTitle("TRT");
        trtAllowed.setDescription("Real");
        trtAllowed.setPubDate("2026-06-01");
        trtAllowed.setSource("TRT Haber Ekonomi");

        String cachedJson = objectMapper.writeValueAsString(List.of(bloomberg, trtAllowed));
        when(valueOps.get("cache:news:v15")).thenReturn(cachedJson);
        when(rssClient.fetchNewsFromSource(anyString(), anyString())).thenReturn(List.of());

        service.fetchAndCacheNews();

        // Bloomberg purge edildi → cache yeniden yazılmalı (purgedCount > 0 → changed = true)
        verify(valueOps).set(eq("cache:news:v15"), any(), eq(Duration.ofDays(7)));
    }

    @Test
    void fetch_emptyDescriptionItems_filteredOut() {
        when(valueOps.get("cache:news:v15")).thenReturn(null);
        NewsDto good = news("http://good", "Good Title", "Real content here", "2026-06-01");
        NewsDto emptyDesc = news("http://empty", "Empty Title", "", "2026-06-01");
        NewsDto bracketDesc = news("http://bracket", "Bracket Title", "[]", "2026-06-01");

        when(rssClient.fetchNewsFromSource(anyString(), anyString()))
                .thenReturn(List.of(good, emptyDesc, bracketDesc));
        when(categoryClassifier.assignCategory(anyString(), anyString())).thenReturn("Genel");

        service.fetchAndCacheNews();

        verify(rssClient, atLeastOnce()).fetchNewsFromSource(anyString(), anyString());
        // Sadece "good" cache'e yazıldı, emptyDesc + bracketDesc atlandı.
        verify(categoryClassifier, atLeastOnce()).assignCategory("Good Title", "Real content here");
        verify(categoryClassifier, org.mockito.Mockito.never()).assignCategory("Empty Title", "");
        verify(categoryClassifier, org.mockito.Mockito.never()).assignCategory("Bracket Title", "[]");
    }

    // -------- syncOnStartupWhenTranslationReady --------

    @Test
    void startup_translationReady_triggersInitialSync() {
        when(translationClient.isAvailable()).thenReturn(true);
        when(valueOps.get("cache:news:v15")).thenReturn(null);
        when(rssClient.fetchNewsFromSource(anyString(), anyString()))
                .thenReturn(List.of(news("http://x", "T", "D", "2026-06-01")));
        when(categoryClassifier.assignCategory(anyString(), anyString())).thenReturn("Genel");

        service.syncOnStartupWhenTranslationReady();
        // CompletableFuture.runAsync arka planda çalışır → Mockito'nun timeout()'ı ile bekle.
        // Thread.sleep yerine verify(timeout) kullanılır (S2925: testlerde Thread.sleep yok).
        verify(valueOps, org.mockito.Mockito.timeout(5000))
                .set(eq("cache:news:v15"), any(), eq(Duration.ofDays(7)));
    }

    @Test
    void translatePendingNews_capRespected() {
        when(translationClient.isAvailable()).thenReturn(true);
        when(translationClient.translate(anyString(), anyString(), anyString())).thenReturn("translated");

        java.util.List<NewsDto> many = new java.util.ArrayList<>();
        for (int i = 0; i < 100; i++) {
            many.add(news("http://x" + i, "T" + i, "D" + i, "2026-06-01"));
        }

        int translated = service.translatePendingNews(many);

        // cap = 60
        assertEquals(60, translated);
    }
}
