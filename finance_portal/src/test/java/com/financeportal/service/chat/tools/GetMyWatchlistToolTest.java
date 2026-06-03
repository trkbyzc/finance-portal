package com.financeportal.service.chat.tools;

import com.financeportal.model.dto.watchlist.WatchlistItemDto;
import com.financeportal.model.enums.AssetType;
import com.financeportal.service.watchlist.WatchlistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GetMyWatchlistToolTest {

    private WatchlistService watchlistService;
    private GetMyWatchlistTool tool;

    @BeforeEach
    void setUp() {
        watchlistService = mock(WatchlistService.class);
        tool = new GetMyWatchlistTool(watchlistService);
    }

    private WatchlistItemDto sample(String symbol, AssetType type, String price, String change) {
        return WatchlistItemDto.builder()
                .id(UUID.randomUUID())
                .symbol(symbol)
                .assetType(type)
                .addedAt(LocalDateTime.now())
                .currentPrice(new BigDecimal(price))
                .dailyChangePct(new BigDecimal(change))
                .build();
    }

    @Test
    void name_ve_schema_dogru() {
        assertEquals("get_my_watchlist", tool.name());
        assertNotNull(tool.description());
    }

    @Test
    void watchlist_simplify_olur() {
        when(watchlistService.getMyWatchlist()).thenReturn(List.of(
                sample("BTC", AssetType.CRYPTO, "65000", "-2.5"),
                sample("USD", AssetType.CURRENCY, "32.45", "0.3")
        ));

        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.execute(Map.of());

        assertEquals(2, out.get("count"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> wl = (List<Map<String, Object>>) out.get("watchlist");
        assertEquals("BTC", wl.get(0).get("symbol"));
        assertEquals(AssetType.CRYPTO, wl.get(0).get("assetType"));
        assertNotNull(wl.get(0).get("currentPrice"));
        assertNotNull(wl.get(0).get("dailyChangePct"));
    }

    @Test
    void bos_watchlist_count_0() {
        when(watchlistService.getMyWatchlist()).thenReturn(List.of());
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.execute(Map.of());
        assertEquals(0, out.get("count"));
    }
}
