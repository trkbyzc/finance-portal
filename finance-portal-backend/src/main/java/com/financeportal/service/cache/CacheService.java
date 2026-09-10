package com.financeportal.service.cache;

import com.financeportal.exception.DataSourceUnavailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

/**
 * Redis cache işlemlerini merkezileştiren service; exception handling ve getOrFetch
 * pattern burada tutulur, çağıran kod cache varlığından habersiz kalır.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    public void save(String key, Object data, long durationInMinutes) {
        try {
            redisTemplate.opsForValue().set(key, data, Duration.ofMinutes(durationInMinutes));
            log.debug("Cache yazıldı: {} ({}dk)", key, durationInMinutes);
        } catch (Exception e) {
            log.warn("Cache yazma hatası ({}): {}", key, e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public <T> List<T> get(String key) {
        try {
            Object cachedData = redisTemplate.opsForValue().get(key);
            if (cachedData != null) {
                log.debug("Cache bulundu: {}", key);
                return (List<T>) cachedData;
            }
            return new ArrayList<>();
        } catch (Exception e) {
            log.warn("Cache okuma hatası ({}): {}", key, e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Cache'te varsa döner, yoksa fetcher supplier'ını çalıştırıp sonucu cache'e yazar.
     * Örnek: cacheService.getOrFetch("market:bist", () -> api.fetchBist(), 60)
     */
    public <T> List<T> getOrFetch(String key, Supplier<List<T>> fetcher, long durationInMinutes) {
        try {
            List<T> cached = get(key);
            if (!cached.isEmpty()) {
                log.debug("Cache kullanılıyor: {}", key);
                return cached;
            }

            log.debug("Cache boş, veri çekiliyor: {}", key);
            List<T> fresh = fetcher.get();

            if (!fresh.isEmpty()) {
                save(key, fresh, durationInMinutes);
                log.info("Yeni veri çekildi ve cache'e yazıldı: {}", key);
            }

            return fresh;
        } catch (DataSourceUnavailableException e) {
            // Kaynak bu ortamda bilinçli olarak kapatılmış — bu bir arıza değil, politika.
            // Aşağıdaki genel catch bunu yutup boş liste dönseydi arayüz gerekçeyi
            // açıklayan bilgi kartı yerine bomboş bir sekme gösterirdi (canlıda tam
            // olarak bu oldu: /market-data/eurobonds ve /bank-currencies "200 []" dönüyordu).
            // Yeniden fırlatılır; GlobalExceptionHandler 503 + DATA_SOURCE_UNAVAILABLE üretir.
            throw e;
        } catch (Exception e) {
            log.error("getOrFetch hatası ({}): {}", key, e.getMessage());
            return new ArrayList<>();
        }
    }

    public void delete(String key) {
        try {
            redisTemplate.delete(key);
            log.debug("Cache silindi: {}", key);
        } catch (Exception e) {
            log.warn("Cache silme hatası ({}): {}", key, e.getMessage());
        }
    }

    // Redis glob pattern (ör: "market:*") ile eşleşen tüm key'leri siler.
    public void deletePattern(String pattern) {
        try {
            var keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("Cache pattern silindi: {} ({} key)", pattern, keys.size());
            }
        } catch (Exception e) {
            log.warn("Cache pattern silme hatası ({}): {}", pattern, e.getMessage());
        }
    }

    public boolean exists(String key) {
        try {
            Boolean exists = redisTemplate.hasKey(key);
            return exists != null && exists;
        } catch (Exception e) {
            log.warn("Cache existence check hatası ({}): {}", key, e.getMessage());
            return false;
        }
    }

    public long getTtl(String key) {
        try {
            Long ttl = redisTemplate.getExpire(key);
            return ttl != null ? ttl : -2; // -2 key yok, -1 expire yok
        } catch (Exception e) {
            log.warn("Cache TTL check hatası ({}): {}", key, e.getMessage());
            return -2;
        }
    }
}

