package com.financeportal.service.cache;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

/**
 * Redis cache işlemlerini merkezileştiren service
 * Tüm cache read/write işlemleri bu service üzerinden yapılır
 *
 * Avantajlar:
 * - Cache logic bir yerde
 * - Exception handling merkezileştirilmiş
 * - getOrFetch pattern ile kod tekrarı ortadan kalkar
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * Cache'e veri yazma
     *
     * @param key Cache anahtarı
     * @param data Saklanacak veri
     * @param durationInMinutes Cache süresi (dakika cinsinden)
     */
    public void save(String key, Object data, long durationInMinutes) {
        try {
            redisTemplate.opsForValue().set(key, data, Duration.ofMinutes(durationInMinutes));
            log.debug("✅ Cache yazıldı: {} ({}dk)", key, durationInMinutes);
        } catch (Exception e) {
            log.warn("⚠️ Cache yazma hatası ({}): {}", key, e.getMessage());
        }
    }

    /**
     * Cache'ten veri okuma
     *
     * @param key Cache anahtarı
     * @return Cached veri (varsa), yoksa boş ArrayList
     */
    @SuppressWarnings("unchecked")
    public <T> List<T> get(String key) {
        try {
            Object cachedData = redisTemplate.opsForValue().get(key);
            if (cachedData != null) {
                log.debug("✅ Cache bulundu: {}", key);
                return (List<T>) cachedData;
            }
            return new ArrayList<>();
        } catch (Exception e) {
            log.warn("⚠️ Cache okuma hatası ({}): {}", key, e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Cache'ten getir, yoksa fetcher'ı çalıştır ve cache'e yaz
     *
     * Pattern:
     * List<Data> result = cacheService.getOrFetch(
     *     "cache:key",
     *     () -> apiClient.fetchData(),
     *     60  // 60 dakika cache
     * );
     *
     * @param key Cache anahtarı
     * @param fetcher Cache'de yoksa çalıştırılacak supplier
     * @param durationInMinutes Cache süresi
     * @return Cached ya da yeni fetch edilen veri
     */
    public <T> List<T> getOrFetch(String key, Supplier<List<T>> fetcher, long durationInMinutes) {
        try {
            // Önce cache'te kontrol et
            List<T> cached = get(key);
            if (!cached.isEmpty()) {
                log.debug("📦 Cache kullanılıyor: {}", key);
                return cached;
            }

            // Cache'te yoksa, veri çek
            log.debug("🔄 Cache boş, veri çekiliyor: {}", key);
            List<T> fresh = fetcher.get();

            // Yeni veriyi cache'e yaz
            if (!fresh.isEmpty()) {
                save(key, fresh, durationInMinutes);
                log.info("✨ Yeni veri çekildi ve cache'e yazıldı: {}", key);
            }

            return fresh;
        } catch (Exception e) {
            log.error("❌ getOrFetch hatası ({}): {}", key, e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Belirli bir key'i cache'ten sil
     *
     * @param key Silinecek cache anahtarı
     */
    public void delete(String key) {
        try {
            redisTemplate.delete(key);
            log.debug("🗑️ Cache silindi: {}", key);
        } catch (Exception e) {
            log.warn("⚠️ Cache silme hatası ({}): {}", key, e.getMessage());
        }
    }

    /**
     * Pattern ile matching cache'leri sil
     *
     * @param pattern Redis pattern (ör: "cache:*")
     */
    public void deletePattern(String pattern) {
        try {
            var keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("🗑️ Cache pattern silindi: {} ({} key)", pattern, keys.size());
            }
        } catch (Exception e) {
            log.warn("⚠️ Cache pattern silme hatası ({}): {}", pattern, e.getMessage());
        }
    }

    /**
     * Cache'te bir key'in var olup olmadığını kontrol et
     */
    public boolean exists(String key) {
        try {
            Boolean exists = redisTemplate.hasKey(key);
            return exists != null && exists;
        } catch (Exception e) {
            log.warn("⚠️ Cache existence check hatası ({}): {}", key, e.getMessage());
            return false;
        }
    }

    /**
     * Cache'in TTL (Time To Live) süresini al
     */
    public long getTtl(String key) {
        try {
            Long ttl = redisTemplate.getExpire(key);
            return ttl != null ? ttl : -2; // -2 key yok, -1 expire yok
        } catch (Exception e) {
            log.warn("⚠️ Cache TTL check hatası ({}): {}", key, e.getMessage());
            return -2;
        }
    }
}

