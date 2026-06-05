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
import com.financeportal.domains.fund.dto.FundDto;
import com.financeportal.domains.fund.service.FundService;
import com.financeportal.security.SecurityUtils;
import com.financeportal.service.market.MarketChartService;
import com.financeportal.service.portfolio.PortfolioPriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WatchlistService {

    private static final int SPARKLINE_MAX_POINTS = 30;

    private final WatchlistItemRepository watchlistItemRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final PortfolioPriceService portfolioPriceService;
    private final MarketChartService marketChartService;
    private final FundService fundService;

    public List<WatchlistItemDto> getMyWatchlist() {
        UUID userId = securityUtils.getCurrentUserId();
        List<WatchlistItem> items = watchlistItemRepository.findByUser_IdOrderByAddedAtDesc(userId);

        List<WatchlistItemDto> result = new ArrayList<>(items.size());
        for (WatchlistItem item : items) {
            result.add(enrich(item));
        }
        return result;
    }

    @Transactional
    public WatchlistItemDto addToWatchlist(WatchlistAddRequestDto request) {
        UUID userId = securityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

        WatchlistItem existing = watchlistItemRepository
                .findByUser_IdAndSymbolAndAssetType(userId, request.getSymbol(), request.getAssetType())
                .orElse(null);

        if (existing != null) {
            log.info("[WATCHLIST] {} ({}) zaten listede, idempotent dönüş.", request.getSymbol(), request.getAssetType());
            return enrich(existing);
        }

        WatchlistItem fresh = new WatchlistItem(
                UUID.randomUUID(),
                user,
                request.getSymbol(),
                request.getAssetType(),
                LocalDateTime.now()
        );
        watchlistItemRepository.save(fresh);
        log.info("[WATCHLIST] Eklendi: {} ({}) user={}", fresh.getSymbol(), fresh.getAssetType(), userId);
        return enrich(fresh);
    }

    @Transactional
    public void removeFromWatchlist(UUID itemId) {
        UUID userId = securityUtils.getCurrentUserId();
        WatchlistItem item = watchlistItemRepository.findByIdAndUser_Id(itemId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("İzleme listesi kaydı bulunamadı: " + itemId));
        watchlistItemRepository.delete(item);
        log.info("[WATCHLIST] Silindi: {} ({}) user={}", item.getSymbol(), item.getAssetType(), userId);
    }

    private WatchlistItemDto enrich(WatchlistItem item) {
        BigDecimal currentPrice = safe(portfolioPriceService.getCurrentPrice(item.getSymbol(), item.getAssetType()));

        // MarketChartService cache hit'inde Redis'ten generic Object (LinkedHashMap) dönüyor;
        // miss'te tip-doğru HistoricalDataDto döner. İkisine de toleranslı oku.
        List<?> history = safeFetchHistory(item.getSymbol(), item.getAssetType());
        List<BigDecimal> sparkline = extractSparkline(history);
        BigDecimal dailyChange = computeDailyChangePct(history);

        return WatchlistItemDto.builder()
                .id(item.getId())
                .symbol(item.getSymbol())
                .assetType(item.getAssetType())
                .addedAt(item.getAddedAt())
                .currentPrice(currentPrice)
                .dailyChangePct(dailyChange)
                .sparkline(sparkline)
                .build();
    }

    private List<?> safeFetchHistory(String symbol, AssetType assetType) {
        try {
            // FUND için kategori ayrımı: TEFAS TR fonu mu, yoksa global ETF (Yahoo) mi?
            // FundChartStrategy yalnız category=TR_FUND için çalışıyor; "FUND" gönderirsek
            // YahooDefaultChartStrategy'ye düşer ve TR fonu için boş döner → dailyChangePct=0.
            // Bu yüzden symbol'ün cache'lenmiş TR fon listesinde olup olmadığına bakıp routing yapıyoruz.
            String category;
            String range;
            if (assetType == AssetType.FUND && isTrFundSymbol(symbol)) {
                category = "TR_FUND";
                // TR fonların bazı feed'leri haftada güncelleniyor → 1mo bazen <2 nokta döner ve
                // dailyChange=0 olur. 1y güvenli (sparkline son 30 noktayı zaten kırpıyor).
                range = "1y";
            } else {
                category = assetType.name();
                range = "1mo";
            }
            return marketChartService.getHistoricalDataWithEvdsFallback(
                    symbol, category, range, "1d", null, null, 0);
        } catch (Exception e) {
            log.warn("[WATCHLIST] {} için historical fetch başarısız: {}", symbol, e.getMessage());
            return List.of();
        }
    }

    private boolean isTrFundSymbol(String symbol) {
        if (symbol == null || symbol.isBlank()) return false;
        try {
            // Cache hit'te Redis generic List<LinkedHashMap> dönüyor (Jackson default typing
            // kapalı, @class info kaybediliyor); cache miss'te tip-doğru List<FundDto>.
            // İkisine de toleranslı oku — historical close okuyucusuyla aynı pattern.
            List<?> trFunds = fundService.getTrFunds();
            if (trFunds == null || trFunds.isEmpty()) return false;
            String want = symbol.trim();
            for (Object o : trFunds) {
                String s = extractFundSymbol(o);
                if (s != null && want.equalsIgnoreCase(s)) return true;
            }
            return false;
        } catch (Exception e) {
            log.warn("[WATCHLIST] TR fon kontrolü başarısız ({}): {}", symbol, e.getMessage());
            return false;
        }
    }

    private String extractFundSymbol(Object o) {
        if (o == null) return null;
        if (o instanceof FundDto f) return f.getSymbol();
        if (o instanceof Map<?, ?> m) {
            Object s = m.get("symbol");
            return s != null ? s.toString() : null;
        }
        return null;
    }

    private List<BigDecimal> extractSparkline(List<?> history) {
        if (history == null || history.isEmpty()) return List.of();
        int size = history.size();
        int from = Math.max(0, size - SPARKLINE_MAX_POINTS);
        List<BigDecimal> spark = new ArrayList<>(size - from);
        for (int i = from; i < size; i++) {
            BigDecimal close = closeOf(history.get(i));
            spark.add(close != null ? close : BigDecimal.ZERO);
        }
        return spark;
    }

    private BigDecimal computeDailyChangePct(List<?> history) {
        if (history == null || history.size() < 2) return BigDecimal.ZERO;
        BigDecimal latest = closeOf(history.get(history.size() - 1));
        BigDecimal previous = closeOf(history.get(history.size() - 2));
        if (latest == null || previous == null || previous.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return latest.subtract(previous)
                .divide(previous, 6, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Cache hit'te LinkedHashMap, miss'te HistoricalDataDto. İkisine de toleranslı close okuyucu.
     */
    private BigDecimal closeOf(Object point) {
        if (point == null) return null;
        if (point instanceof HistoricalDataDto dto) return dto.getClose();
        if (point instanceof Map<?, ?> map) {
            Object close = map.get("close");
            if (close == null) close = map.get("price");
            return toBigDecimal(close);
        }
        return null;
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return null;
        if (val instanceof BigDecimal bd) return bd;
        if (val instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        if (val instanceof String s) {
            try { return new BigDecimal(s); } catch (NumberFormatException ignored) { return null; }
        }
        return null;
    }

    private BigDecimal safe(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }
}
