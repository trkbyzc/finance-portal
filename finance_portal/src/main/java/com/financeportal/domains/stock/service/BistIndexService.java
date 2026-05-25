package com.financeportal.domains.stock.service;

import com.financeportal.domains.stock.client.IsYatirimIndexClient;
import com.financeportal.service.cache.CacheService;
import com.financeportal.util.BistConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * BIST endeks (BIST30/50/100) sembol listelerinin canlı kaynağı.
 *
 * Birincil kaynak: İş Yatırım (HTML scrape).
 * Fallback: {@link BistConstants} (upstream düşerse).
 *
 * Cache: Redis, 24 saatlik TTL — endeks kompozisyonu çeyrek dönemlik değişir,
 * günde birden fazla çağrı yapmaya gerek yok.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BistIndexService {

    private static final String CACHE_KEY_BIST30 = "cache:bist-index:XU030";
    private static final String CACHE_KEY_BIST50 = "cache:bist-index:XU050";
    private static final String CACHE_KEY_BIST100 = "cache:bist-index:XU100";

    private static final long CACHE_TTL_MINUTES = 24 * 60L;

    private final IsYatirimIndexClient isYatirimIndexClient;
    private final CacheService cacheService;

    public Set<String> getBist30() {
        return getOrFallback(CACHE_KEY_BIST30, "XU030", BistConstants.BIST_30);
    }

    /**
     * BIST 50'nin TAM üyeliği (50 sembol). Üst-küme: BIST30 ⊂ BIST50.
     * Fallback: BistConstants.BIST_30 ∪ BIST_50_EK_HISSELER.
     */
    public Set<String> getBist50() {
        return getOrFallback(CACHE_KEY_BIST50, "XU050",
                union(BistConstants.BIST_30, BistConstants.BIST_50_EK_HISSELER));
    }

    /**
     * BIST 100'ün TAM üyeliği (100 sembol). Üst-küme: BIST50 ⊂ BIST100.
     * Fallback: BIST_30 ∪ BIST_50_EK ∪ BIST_100_EK.
     */
    public Set<String> getBist100() {
        return getOrFallback(CACHE_KEY_BIST100, "XU100",
                union(BistConstants.BIST_30, BistConstants.BIST_50_EK_HISSELER, BistConstants.BIST_100_EK_HISSELER));
    }

    private Set<String> getOrFallback(String cacheKey, String endeks, Set<String> fallback) {
        List<String> cached = cacheService.get(cacheKey);
        if (!cached.isEmpty()) return new LinkedHashSet<>(cached);

        Set<String> fresh = isYatirimIndexClient.fetchIndex(endeks);
        if (!fresh.isEmpty()) {
            cacheService.save(cacheKey, new ArrayList<>(fresh), CACHE_TTL_MINUTES);
            return fresh;
        }

        log.warn("[BIST_INDEX] {} için upstream başarısız, BistConstants fallback'i kullanılıyor ({} sembol)",
                endeks, fallback.size());
        return fallback;
    }

    /**
     * Boot'tan 30sn sonra ilk fetch, sonra 24 saatte bir yenile.
     * Önemli: getX() çağrılarındaki cache miss'i boot sırasında yaşamamak için.
     */
    @Scheduled(fixedRate = 86_400_000L, initialDelay = 30_000L)
    public void refreshAll() {
        log.info("[BIST_INDEX] Günlük yenileme başlıyor...");
        cacheService.delete(CACHE_KEY_BIST30);
        cacheService.delete(CACHE_KEY_BIST50);
        cacheService.delete(CACHE_KEY_BIST100);
        int s30 = getBist30().size();
        int s50 = getBist50().size();
        int s100 = getBist100().size();
        log.info("[BIST_INDEX] Yenileme tamam: BIST30={}, BIST50={}, BIST100={}", s30, s50, s100);
    }

    @SafeVarargs
    private static Set<String> union(Set<String>... sets) {
        Set<String> u = new LinkedHashSet<>();
        for (Set<String> s : sets) if (s != null) u.addAll(s);
        return u;
    }
}
