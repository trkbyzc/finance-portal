package com.financeportal.service.watchlist;

import com.financeportal.exception.ResourceNotFoundException;
import com.financeportal.model.dto.market.HistoricalDataDto;
import com.financeportal.model.dto.watchlist.WatchlistAddRequestDto;
import com.financeportal.model.dto.watchlist.WatchlistItemDto;
import com.financeportal.model.entity.User;
import com.financeportal.model.entity.WatchlistItem;
import com.financeportal.model.enums.AssetType;
import com.financeportal.repository.UserRepository;
import com.financeportal.repository.WatchlistItemRepository;
import com.financeportal.domains.fund.service.FundService;
import com.financeportal.security.SecurityUtils;
import com.financeportal.service.market.MarketChartService;
import com.financeportal.service.portfolio.PortfolioPriceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WatchlistServiceTest {

    @Mock private WatchlistItemRepository watchlistRepo;
    @Mock private UserRepository userRepo;
    @Mock private SecurityUtils securityUtils;
    @Mock private PortfolioPriceService priceService;
    @Mock private MarketChartService chartService;
    @Mock private FundService fundService;

    @InjectMocks private WatchlistService service;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        when(securityUtils.getCurrentUserId()).thenReturn(userId);
    }

    // -------- getMyWatchlist --------

    @Test
    void getMy_emptyWatchlist_returnsEmpty() {
        when(watchlistRepo.findByUser_IdOrderByAddedAtDesc(userId)).thenReturn(List.of());
        List<WatchlistItemDto> result = service.getMyWatchlist();
        assertTrue(result.isEmpty());
    }

    @Test
    void getMy_singleItem_enrichedWithPriceAndSparkline() {
        WatchlistItem item = makeItem("BTC", AssetType.CRYPTO);
        when(watchlistRepo.findByUser_IdOrderByAddedAtDesc(userId)).thenReturn(List.of(item));
        when(priceService.getCurrentPrice("BTC", AssetType.CRYPTO)).thenReturn(new BigDecimal("60000"));
        when(chartService.getHistoricalDataWithEvdsFallback(eq("BTC"), eq("CRYPTO"), anyString(), anyString(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(58000), bar(59000), bar(60000)));

        List<WatchlistItemDto> result = service.getMyWatchlist();

        assertEquals(1, result.size());
        WatchlistItemDto dto = result.get(0);
        assertEquals("BTC", dto.getSymbol());
        assertEquals(new BigDecimal("60000"), dto.getCurrentPrice());
        assertEquals(3, dto.getSparkline().size());
        // dailyChangePct = (60000-59000)/59000 * 100 ≈ 1.69
        assertTrue(dto.getDailyChangePct().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    void getMy_nullCurrentPrice_substitutesZero() {
        WatchlistItem item = makeItem("X", AssetType.STOCK);
        when(watchlistRepo.findByUser_IdOrderByAddedAtDesc(userId)).thenReturn(List.of(item));
        when(priceService.getCurrentPrice(anyString(), any())).thenReturn(null);
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of());

        List<WatchlistItemDto> result = service.getMyWatchlist();
        assertEquals(BigDecimal.ZERO, result.get(0).getCurrentPrice());
    }

    @Test
    void getMy_chartServiceThrows_safelyReturnsEmptyHistoryAndZeroChange() {
        WatchlistItem item = makeItem("X", AssetType.STOCK);
        when(watchlistRepo.findByUser_IdOrderByAddedAtDesc(userId)).thenReturn(List.of(item));
        when(priceService.getCurrentPrice(anyString(), any())).thenReturn(new BigDecimal("100"));
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenThrow(new RuntimeException("down"));

        List<WatchlistItemDto> result = service.getMyWatchlist();
        assertTrue(result.get(0).getSparkline().isEmpty());
        assertEquals(BigDecimal.ZERO, result.get(0).getDailyChangePct());
    }

    @Test
    void getMy_sparklineCappedAt30Points() {
        WatchlistItem item = makeItem("X", AssetType.STOCK);
        when(watchlistRepo.findByUser_IdOrderByAddedAtDesc(userId)).thenReturn(List.of(item));
        when(priceService.getCurrentPrice(anyString(), any())).thenReturn(new BigDecimal("100"));

        // 50 history point — sparkline son 30'a kırpılmalı
        List<HistoricalDataDto> bars = new java.util.ArrayList<>();
        for (int i = 0; i < 50; i++) bars.add(bar(100 + i));
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn((List) bars);

        List<WatchlistItemDto> result = service.getMyWatchlist();
        assertEquals(30, result.get(0).getSparkline().size());
        // Son nokta = bar(149)
        assertEquals(0, BigDecimal.valueOf(149).compareTo(result.get(0).getSparkline().get(29)));
    }

    @Test
    void getMy_linkedHashMapHistory_extractsCloseField() {
        WatchlistItem item = makeItem("X", AssetType.STOCK);
        when(watchlistRepo.findByUser_IdOrderByAddedAtDesc(userId)).thenReturn(List.of(item));
        when(priceService.getCurrentPrice(anyString(), any())).thenReturn(new BigDecimal("100"));

        // Cache hit: LinkedHashMap dönüyor
        LinkedHashMap<String, Object> map1 = new LinkedHashMap<>();
        map1.put("close", 100.0);
        LinkedHashMap<String, Object> map2 = new LinkedHashMap<>();
        map2.put("close", 110.0);
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn((List) List.of(map1, map2));

        List<WatchlistItemDto> result = service.getMyWatchlist();
        assertEquals(2, result.get(0).getSparkline().size());
        // (110-100)/100*100 = 10%
        assertEquals(0, new BigDecimal("10.00").compareTo(result.get(0).getDailyChangePct()));
    }

    @Test
    void getMy_mapWithoutCloseUsesPriceField() {
        WatchlistItem item = makeItem("X", AssetType.STOCK);
        when(watchlistRepo.findByUser_IdOrderByAddedAtDesc(userId)).thenReturn(List.of(item));
        when(priceService.getCurrentPrice(anyString(), any())).thenReturn(new BigDecimal("100"));

        LinkedHashMap<String, Object> map = new LinkedHashMap<>();
        map.put("price", "50.5"); // string parse
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn((List) List.of(map));

        List<WatchlistItemDto> result = service.getMyWatchlist();
        assertEquals(new BigDecimal("50.5"), result.get(0).getSparkline().get(0));
    }

    @Test
    void getMy_singlePointHistory_dailyChangeIsZero() {
        WatchlistItem item = makeItem("X", AssetType.STOCK);
        when(watchlistRepo.findByUser_IdOrderByAddedAtDesc(userId)).thenReturn(List.of(item));
        when(priceService.getCurrentPrice(anyString(), any())).thenReturn(new BigDecimal("100"));
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(100)));

        List<WatchlistItemDto> result = service.getMyWatchlist();
        // Tek nokta, dailyChange = 0
        assertEquals(BigDecimal.ZERO, result.get(0).getDailyChangePct());
    }

    @Test
    void getMy_previousIsZero_dailyChangeIsZeroNotDivByZero() {
        WatchlistItem item = makeItem("X", AssetType.STOCK);
        when(watchlistRepo.findByUser_IdOrderByAddedAtDesc(userId)).thenReturn(List.of(item));
        when(priceService.getCurrentPrice(anyString(), any())).thenReturn(new BigDecimal("100"));
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of(bar(0), bar(100)));

        List<WatchlistItemDto> result = service.getMyWatchlist();
        assertEquals(BigDecimal.ZERO, result.get(0).getDailyChangePct());
    }

    // -------- addToWatchlist --------

    @Test
    void add_userMissing_throws404() {
        when(userRepo.findById(userId)).thenReturn(Optional.empty());
        WatchlistAddRequestDto req = new WatchlistAddRequestDto("BTC", AssetType.CRYPTO);
        assertThrows(ResourceNotFoundException.class, () -> service.addToWatchlist(req));
    }

    @Test
    void add_alreadyExists_idempotentReturn_noSave() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        WatchlistItem existing = makeItem("BTC", AssetType.CRYPTO);
        when(watchlistRepo.findByUser_IdAndSymbolAndAssetType(userId, "BTC", AssetType.CRYPTO))
                .thenReturn(Optional.of(existing));
        when(priceService.getCurrentPrice(anyString(), any())).thenReturn(new BigDecimal("60000"));
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of());

        WatchlistItemDto result = service.addToWatchlist(new WatchlistAddRequestDto("BTC", AssetType.CRYPTO));

        assertEquals("BTC", result.getSymbol());
        verify(watchlistRepo, never()).save(any());
    }

    @Test
    void add_newItem_savesAndReturnsEnriched() {
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        when(watchlistRepo.findByUser_IdAndSymbolAndAssetType(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(priceService.getCurrentPrice(anyString(), any())).thenReturn(new BigDecimal("3000"));
        when(chartService.getHistoricalDataWithEvdsFallback(any(), any(), any(), any(), any(), any(), anyInt()))
                .thenReturn(List.of());

        WatchlistItemDto result = service.addToWatchlist(new WatchlistAddRequestDto("ETH", AssetType.CRYPTO));

        assertEquals("ETH", result.getSymbol());
        ArgumentCaptor<WatchlistItem> cap = ArgumentCaptor.forClass(WatchlistItem.class);
        verify(watchlistRepo).save(cap.capture());
        assertEquals("ETH", cap.getValue().getSymbol());
        assertEquals(AssetType.CRYPTO, cap.getValue().getAssetType());
        assertEquals(user, cap.getValue().getUser());
        assertNotNull(cap.getValue().getId());
        assertNotNull(cap.getValue().getAddedAt());
    }

    // -------- removeFromWatchlist --------

    @Test
    void remove_itemMissing_throws404() {
        UUID itemId = UUID.randomUUID();
        when(watchlistRepo.findByIdAndUser_Id(itemId, userId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.removeFromWatchlist(itemId));
    }

    @Test
    void remove_itemExists_deletesIt() {
        UUID itemId = UUID.randomUUID();
        WatchlistItem item = makeItem("BTC", AssetType.CRYPTO);
        item.setId(itemId);
        when(watchlistRepo.findByIdAndUser_Id(itemId, userId)).thenReturn(Optional.of(item));

        service.removeFromWatchlist(itemId);

        verify(watchlistRepo).delete(item);
    }

    // -------- helpers --------

    private WatchlistItem makeItem(String symbol, AssetType type) {
        return new WatchlistItem(UUID.randomUUID(), user, symbol, type, LocalDateTime.now());
    }

    private HistoricalDataDto bar(double close) {
        HistoricalDataDto dto = new HistoricalDataDto();
        dto.setClose(BigDecimal.valueOf(close));
        return dto;
    }
}
