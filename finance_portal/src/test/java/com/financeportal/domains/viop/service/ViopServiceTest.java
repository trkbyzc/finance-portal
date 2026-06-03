package com.financeportal.domains.viop.service;

import com.financeportal.domains.viop.client.ViopScraperClient;
import com.financeportal.domains.viop.config.ViopContractSpec;
import com.financeportal.domains.viop.dto.ViopDto;
import com.financeportal.service.cache.CacheService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings({"unchecked", "rawtypes"})
class ViopServiceTest {

    @Mock private ViopScraperClient scraperClient;
    @Mock private CacheService cacheService;
    @Mock private ViopContractSpec contractSpec;

    @InjectMocks private ViopService service;

    @Test
    void getViopData_delegatesToCacheGetOrFetch() {
        ViopDto v = new ViopDto();
        v.setSymbol("F_GARAN0625");
        when(scraperClient.scrapeViopData()).thenReturn(new ArrayList<>(List.of(v)));
        when(contractSpec.getContractSize("F_GARAN0625")).thenReturn(new BigDecimal("100"));
        when(cacheService.getOrFetch(eq("cache:viop"), any(Supplier.class), eq(5L))).thenAnswer(inv -> {
            Supplier<?> supplier = inv.getArgument(1);
            return supplier.get();
        });

        @SuppressWarnings("unchecked")
        List<ViopDto> result = (List<ViopDto>) service.getViopData();

        assertEquals(1, result.size());
        assertEquals(new BigDecimal("100"), result.get(0).getContractSize());
    }

    @Test
    void fetchViopData_nonEmpty_savesCache() {
        ViopDto v = new ViopDto();
        v.setSymbol("F_XU0300625");
        when(scraperClient.scrapeViopData()).thenReturn(new ArrayList<>(List.of(v)));
        when(contractSpec.getContractSize("F_XU0300625")).thenReturn(new BigDecimal("10"));

        service.fetchViopData();

        verify(cacheService).save(eq("cache:viop"), any(), eq(5L));
    }

    @Test
    void fetchViopData_emptyList_doesNotSave() {
        when(scraperClient.scrapeViopData()).thenReturn(new ArrayList<>());

        service.fetchViopData();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void fetchViopData_null_doesNotSave() {
        when(scraperClient.scrapeViopData()).thenReturn(null);

        service.fetchViopData();

        verify(cacheService, never()).save(anyString(), any(), anyLong());
    }

    @Test
    void withContractSize_nullPassedThrough_handlesGracefully() {
        // Already exercised via fetchViopData_null but also via getViopData path
        when(scraperClient.scrapeViopData()).thenReturn(null);
        when(cacheService.getOrFetch(eq("cache:viop"), any(Supplier.class), eq(5L))).thenAnswer(inv -> {
            Supplier<?> supplier = inv.getArgument(1);
            return supplier.get();
        });

        Object result = service.getViopData();
        // withContractSize(null) returns null
        assertNull(result);
    }
}
