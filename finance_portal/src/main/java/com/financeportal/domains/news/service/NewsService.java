package com.financeportal.domains.news.service;

import com.financeportal.domains.news.client.NewsScraperClient;
import com.financeportal.domains.news.client.TranslationClient;
import com.financeportal.domains.news.dto.NewsDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class NewsService {

    private final NewsSyncService newsSyncService;
    private final NewsScraperClient newsScraperClient;
    private final TranslationClient translationClient;
    private final StringRedisTemplate stringRedisTemplate;

    private static final String CONTENT_EN_CACHE_PREFIX = "cache:news:content:en:";
    private static final Duration CONTENT_EN_TTL = Duration.ofDays(7);
    private static final String CATEGORY_ALL_TR = "Tümü";
    private static final String CATEGORY_ALL_EN = "All";

    /** Aktif dile göre haberleri filtreler. EN talep edildiğinde DTO clone'unda title/description/category EN'e swap'lanır. */
    public Map<String, Object> getPagedNews(String category, int page, int size, String lang) {
        long startTime = System.currentTimeMillis();

        List<NewsDto> allNews = newsSyncService.getCachedNews();
        boolean en = "en".equalsIgnoreCase(lang);

        // Tüm / All hem TR hem EN çağrılarda aynı filter'ı geçer.
        boolean isAll = CATEGORY_ALL_TR.equalsIgnoreCase(category) || CATEGORY_ALL_EN.equalsIgnoreCase(category);

        List<NewsDto> filtered = allNews.stream()
                .filter(n -> isAll || matchesCategory(n.getCategory(), category))
                .map(n -> en ? localizeForResponse(n) : n)
                .toList();

        int start = page * size;
        int end = Math.min(start + size, filtered.size());

        List<NewsDto> content = start < filtered.size() ? filtered.subList(start, end) : List.of();

        log.debug("[NEWS_SERVICE] Served {} news items for category '{}' lang={} (Page: {}) in {} ms.",
                content.size(), category, lang, page, (System.currentTimeMillis() - startTime));

        return Map.of(
                "content", content,
                "hasNext", end < filtered.size()
        );
    }

    /** Geriye dönük: lang vermeden çağrılırsa TR davranışı. */
    public Map<String, Object> getPagedNews(String category, int page, int size) {
        return getPagedNews(category, page, size, "tr");
    }

    /**
     * Detay sayfası içeriği.
     * <p>
     * EN davranışı: cache hit → cache'ten direkt; cache miss → SENKRON çeviri yapılır.
     * Lingva (Google ön yüzü) ~1-5sn aldığı için kullanıcı bir refresh gerekmeden EN içeriği
     * görür. Çeviri başarısız olursa TR fallback. Redis'te 7 gün cache'lenir.
     * (Önceden LibreTranslate 10-30sn aldığı için background pattern kullanıyorduk; Lingva ile
     * artık gerek yok — basit sync akış UX'i çok daha iyi.)
     */
    public String getArticleContent(String url, String lang) {
        String trContent = newsScraperClient.scrapeArticleContent(url);
        if (!"en".equalsIgnoreCase(lang) || trContent == null || trContent.isBlank()) {
            return trContent;
        }

        String cacheKey = CONTENT_EN_CACHE_PREFIX + sha1(url);
        String cached = stringRedisTemplate.opsForValue().get(cacheKey);
        if (cached != null && !cached.isEmpty()) return cached;

        String translated = translateLongText(trContent);
        if (translated != null && !translated.isBlank()) {
            try {
                stringRedisTemplate.opsForValue().set(cacheKey, translated, CONTENT_EN_TTL);
            } catch (Exception e) {
                log.warn("[NEWS_SERVICE] EN content cache yazılamadı: {}", e.getMessage());
            }
            return translated;
        }
        return trContent;
    }

    public String getArticleContent(String url) {
        return getArticleContent(url, "tr");
    }

    public List<Map<String, String>> getEconomicCalendar() {
        log.debug("[NEWS_SERVICE] Requesting economic calendar data.");
        return newsScraperClient.scrapeEconomicCalendar();
    }

    /**
     * Uzun metni chunk'lara bölerek çevirir. Lingva GET path-segment limit'i Türkçe UTF-8
     * için pratik olarak ~2500 char (URL ~7.4KB → 8KB server limit'i). Paragraf sınırında böl.
     */
    private static final int CHUNK_SIZE = 2500;

    private String translateLongText(String text) {
        if (text == null) return null;
        if (text.length() <= CHUNK_SIZE) {
            return translationClient.translate(text, "tr", "en");
        }
        StringBuilder out = new StringBuilder(text.length());
        int idx = 0;
        while (idx < text.length()) {
            int end = Math.min(idx + CHUNK_SIZE, text.length());
            if (end < text.length()) {
                int lastBreak = text.lastIndexOf("\n\n", end);
                if (lastBreak > idx) end = lastBreak;
            }
            String chunk = text.substring(idx, end);
            String translated = translationClient.translate(chunk, "tr", "en");
            if (translated == null) return null;
            out.append(translated);
            if (end < text.length()) out.append("\n\n");
            idx = end;
        }
        return out.toString();
    }

    private NewsDto localizeForResponse(NewsDto original) {
        NewsDto copy = new NewsDto(
                original.getTitle(),
                original.getDescription(),
                original.getLink(),
                original.getPubDate(),
                original.getSource(),
                original.getImageUrl(),
                original.getCategory()
        );
        if (original.getTitleEn() != null) copy.setTitle(original.getTitleEn());
        if (original.getDescriptionEn() != null) copy.setDescription(original.getDescriptionEn());
        String catEn = original.getCategoryEn() != null
                ? original.getCategoryEn()
                : NewsCategoryClassifier.localize(original.getCategory(), "en");
        if (catEn != null) copy.setCategory(catEn);
        // İlgili varlık etiketi dilden bağımsız → EN kopyaya da taşı.
        copy.setRelatedSymbol(original.getRelatedSymbol());
        copy.setRelatedName(original.getRelatedName());
        copy.setRelatedCategory(original.getRelatedCategory());
        return copy;
    }

    /**
     * Belirli bir varlığı (sembol) etkileyen haberleri döner — varlık detay sayfasındaki
     * "İlgili Haberler" bölümü için. Eşleşme .IS son ekinden ve büyük/küçük harften bağımsızdır
     * (ASELS, ASELS.IS aynı sayılır).
     */
    public List<NewsDto> getNewsBySymbol(String symbol, int limit, String lang) {
        if (symbol == null || symbol.isBlank()) return List.of();
        String base = normalizeSymbol(symbol);
        boolean en = "en".equalsIgnoreCase(lang);
        return newsSyncService.getCachedNews().stream()
                .filter(n -> n.getRelatedSymbol() != null
                        && normalizeSymbol(n.getRelatedSymbol()).equals(base))
                .map(n -> en ? localizeForResponse(n) : n)
                .limit(limit > 0 ? limit : 6)
                .toList();
    }

    /**
     * Sembolü taban forma indirir; haber relatedSymbol'ü ile varlık sembolünün farklı
     * yahoo varyantlarında gelmesi durumunda eşleşmeyi sağlar:
     *   ASELS.IS → ASELS, BTC-USD → BTC, ETH-USDT → ETH, USDTRY=X → USDTRY, GC=F → GC
     */
    private String normalizeSymbol(String symbol) {
        String s = symbol.trim().toUpperCase().replace(".IS", "");
        if (s.endsWith("=X") || s.endsWith("=F")) {
            s = s.substring(0, s.length() - 2);
        }
        int dash = s.indexOf('-');
        if (dash > 0) {
            s = s.substring(0, dash); // BTC-USD → BTC
        }
        return s;
    }

    /** Frontend "Stocks" gönderse de TR cache'te "Borsa" → ikisine de eşle. */
    private boolean matchesCategory(String newsCategory, String requested) {
        if (newsCategory == null || requested == null) return false;
        if (newsCategory.equalsIgnoreCase(requested)) return true;
        String requestedTr = canonicalTr(requested);
        return requestedTr != null && newsCategory.equalsIgnoreCase(requestedTr);
    }

    private String canonicalTr(String value) {
        if (value == null) return null;
        return switch (value.toLowerCase()) {
            case "crypto" -> NewsCategoryClassifier.KRIPTO;
            case "stocks" -> NewsCategoryClassifier.BORSA;
            case "forex" -> NewsCategoryClassifier.DOVIZ;
            case "commodities" -> NewsCategoryClassifier.EMTIALAR;
            case "bonds & rates" -> NewsCategoryClassifier.TAHVIL;
            case "funds" -> NewsCategoryClassifier.FONLAR;
            case "economy" -> NewsCategoryClassifier.GENEL;
            default -> null;
        };
    }

    private String sha1(String input) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-1").digest(input.getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            // Fallback: hashCode (collision riski var ama URL bazlı, low-risk)
            return Integer.toHexString(input.hashCode());
        }
    }
}
