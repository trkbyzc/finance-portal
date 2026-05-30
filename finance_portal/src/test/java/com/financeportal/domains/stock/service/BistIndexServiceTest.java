package com.financeportal.domains.stock.service;

import com.financeportal.domains.stock.client.IsYatirimIndexClient;
import com.financeportal.service.cache.CacheService;
import com.financeportal.util.BistConstants;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BistIndexServiceTest {

    @Mock
    private IsYatirimIndexClient client;

    @Mock
    private CacheService cacheService;

    @InjectMocks
    private BistIndexService service;

    // -------- cache hit/miss paths --------

    @Test
    void bist30_cacheHit_returnsCachedNoFetch() {
        when(cacheService.<String>get("cache:bist-index:XU030"))
                .thenReturn(List.of("AKBNK", "GARAN"));

        Set<String> result = service.getBist30();

        assertEquals(2, result.size());
        assertTrue(result.contains("AKBNK"));
        verify(client, never()).fetchIndex(anyString());
    }

    @Test
    void bist30_cacheMiss_fetchesFromClientAndCaches() {
        when(cacheService.<String>get("cache:bist-index:XU030")).thenReturn(List.of());
        when(client.fetchIndex("XU030")).thenReturn(Set.of("AKBNK", "GARAN", "THYAO"));

        Set<String> result = service.getBist30();

        assertEquals(3, result.size());
        verify(cacheService).save(eq("cache:bist-index:XU030"), any(), anyLong());
    }

    @Test
    void bist30_clientReturnsEmpty_fallsBackToBistConstants() {
        when(cacheService.<String>get("cache:bist-index:XU030")).thenReturn(List.of());
        when(client.fetchIndex("XU030")).thenReturn(Set.of());

        Set<String> result = service.getBist30();

        // BistConstants.BIST_30 fallback (33 sembol)
        assertEquals(BistConstants.BIST_30.size(), result.size());
        assertTrue(result.contains("AKBNK"));
        // Boş gelince cache'e yazılmaz
        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    // -------- BIST50 union semantics --------

    @Test
    void bist50_cacheMissAndClientFails_unionFallback_includesBist30() {
        when(cacheService.<String>get("cache:bist-index:XU050")).thenReturn(List.of());
        when(client.fetchIndex("XU050")).thenReturn(Set.of());

        Set<String> result = service.getBist50();

        // Fallback = BIST_30 ∪ BIST_50_EK_HISSELER
        assertTrue(result.containsAll(BistConstants.BIST_30));
        assertTrue(result.containsAll(BistConstants.BIST_50_EK_HISSELER));
        assertEquals(BistConstants.BIST_30.size() + BistConstants.BIST_50_EK_HISSELER.size(), result.size());
    }

    // -------- BIST100 superset --------

    @Test
    void bist100_fallback_includesAllThreeTiers() {
        when(cacheService.<String>get("cache:bist-index:XU100")).thenReturn(List.of());
        when(client.fetchIndex("XU100")).thenReturn(Set.of());

        Set<String> result = service.getBist100();

        assertTrue(result.containsAll(BistConstants.BIST_30));
        assertTrue(result.containsAll(BistConstants.BIST_50_EK_HISSELER));
        assertTrue(result.containsAll(BistConstants.BIST_100_EK_HISSELER));
    }

    // -------- refreshAll --------

    @Test
    void refreshAll_deletesAllThreeCachesAndRepopulates() {
        when(cacheService.<String>get(anyString())).thenReturn(List.of());
        when(client.fetchIndex(anyString())).thenReturn(Set.of("DUMMY"));

        service.refreshAll();

        verify(cacheService).delete("cache:bist-index:XU030");
        verify(cacheService).delete("cache:bist-index:XU050");
        verify(cacheService).delete("cache:bist-index:XU100");
        // 3 endeks de fetch edildi
        verify(client).fetchIndex("XU030");
        verify(client).fetchIndex("XU050");
        verify(client).fetchIndex("XU100");
    }

    @Test
    void bist50_resultIsSupersetOfBist30_whenBothCached() {
        when(cacheService.<String>get("cache:bist-index:XU030"))
                .thenReturn(List.of("AKBNK", "GARAN"));
        when(cacheService.<String>get("cache:bist-index:XU050"))
                .thenReturn(List.of("AKBNK", "GARAN", "HALKB", "VAKBN"));

        Set<String> bist30 = service.getBist30();
        Set<String> bist50 = service.getBist50();

        // BIST30 ⊂ BIST50 invariant
        assertTrue(bist50.containsAll(bist30));
        assertFalse(bist30.containsAll(bist50)); // strict superset
    }
}
