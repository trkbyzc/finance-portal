package com.financeportal.service.cache;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CacheServiceTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOps;

    @InjectMocks
    private CacheService cacheService;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Test
    void save_callsRedisWithTtl() {
        cacheService.save("mykey", List.of("a", "b"), 60);

        verify(valueOps).set(eq("mykey"), any(), eq(Duration.ofMinutes(60)));
    }

    @Test
    void save_swallowsRedisException() {
        // RedisTemplate throws — save should NOT throw, just log
        org.mockito.Mockito.doThrow(new RuntimeException("Redis down"))
                .when(valueOps).set(anyString(), any(), any(Duration.class));

        // Exception fırlatılmaması SÖZLEŞME — assertDoesNotThrow ile explicit kontrat
        org.junit.jupiter.api.Assertions.assertDoesNotThrow(
                () -> cacheService.save("k", List.of("v"), 10),
                "Redis hatasında save() exception fırlatmamalı, sessizce log atmalı"
        );
    }

    @Test
    void get_returnsCachedList_whenPresent() {
        List<String> cached = List.of("apple", "banana");
        when(valueOps.get("fruits")).thenReturn(cached);

        List<String> result = cacheService.get("fruits");

        assertEquals(2, result.size());
        assertTrue(result.contains("apple"));
    }

    @Test
    void get_returnsEmptyList_whenKeyMissing() {
        when(valueOps.get("missing")).thenReturn(null);

        List<Object> result = cacheService.get("missing");

        assertTrue(result.isEmpty());
    }

    @Test
    void get_returnsEmptyList_whenRedisThrows() {
        when(valueOps.get(anyString())).thenThrow(new RuntimeException("connection refused"));

        List<Object> result = cacheService.get("bad");

        assertTrue(result.isEmpty());
    }

    @Test
    void getOrFetch_returnsCacheWithoutCallingFetcher_whenCacheHit() {
        List<String> cached = List.of("cached-data");
        when(valueOps.get("hot")).thenReturn(cached);

        @SuppressWarnings("unchecked")
        java.util.function.Supplier<List<String>> fetcher = org.mockito.Mockito.mock(java.util.function.Supplier.class);

        List<String> result = cacheService.getOrFetch("hot", fetcher, 30);

        assertEquals(1, result.size());
        verify(fetcher, never()).get();
    }

    @Test
    void getOrFetch_callsFetcherAndSaves_whenCacheMiss() {
        when(valueOps.get("cold")).thenReturn(null);

        List<String> fresh = List.of("fresh-1", "fresh-2");
        List<String> result = cacheService.getOrFetch("cold", () -> fresh, 30);

        assertEquals(2, result.size());
        // Yeni veri cache'e yazıldı
        verify(valueOps).set(eq("cold"), eq(fresh), eq(Duration.ofMinutes(30)));
    }

    @Test
    void getOrFetch_doesNotSave_whenFetcherReturnsEmpty() {
        when(valueOps.get("empty-fetch")).thenReturn(null);

        List<String> result = cacheService.getOrFetch("empty-fetch", List::of, 30);

        assertTrue(result.isEmpty());
        // Empty list cache'e yazılmaz
        verify(valueOps, never()).set(eq("empty-fetch"), any(), any(Duration.class));
    }

    @Test
    void delete_callsRedisDelete() {
        cacheService.delete("oldkey");
        verify(redisTemplate).delete("oldkey");
    }

    @Test
    void deletePattern_deletesMatchingKeys() {
        Set<String> matchingKeys = Set.of("cache:1", "cache:2", "cache:3");
        when(redisTemplate.keys("cache:*")).thenReturn(matchingKeys);

        cacheService.deletePattern("cache:*");

        verify(redisTemplate).delete(matchingKeys);
    }

    @Test
    void deletePattern_skipsWhenNoMatches() {
        when(redisTemplate.keys("ghost:*")).thenReturn(Set.of());

        cacheService.deletePattern("ghost:*");

        // Hiçbir key bulunamadıysa delete çağrılmaz
        verify(redisTemplate, never()).delete(anyCollection());
    }

    @Test
    void exists_returnsTrue_whenKeyPresent() {
        when(redisTemplate.hasKey("here")).thenReturn(true);
        assertTrue(cacheService.exists("here"));
    }

    @Test
    void exists_returnsFalse_whenKeyMissingOrException() {
        when(redisTemplate.hasKey("nope")).thenReturn(false);
        assertFalse(cacheService.exists("nope"));

        when(redisTemplate.hasKey("err")).thenThrow(new RuntimeException("down"));
        assertFalse(cacheService.exists("err"));
    }

    @Test
    void getTtl_returnsTtlValue() {
        when(redisTemplate.getExpire("k")).thenReturn(120L);
        assertEquals(120L, cacheService.getTtl("k"));
    }

    @Test
    void getTtl_returnsMinus2_whenExceptionOrNull() {
        when(redisTemplate.getExpire("err")).thenThrow(new RuntimeException("redis down"));
        assertEquals(-2L, cacheService.getTtl("err"));

        when(redisTemplate.getExpire("null")).thenReturn(null);
        assertEquals(-2L, cacheService.getTtl("null"));
    }
}
