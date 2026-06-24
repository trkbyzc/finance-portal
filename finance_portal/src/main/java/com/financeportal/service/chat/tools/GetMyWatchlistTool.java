package com.financeportal.service.chat.tools;

import com.financeportal.model.dto.watchlist.WatchlistItemDto;
import com.financeportal.service.watchlist.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GetMyWatchlistTool implements ChatTool {

    private final WatchlistService watchlistService;

    @Override
    public String name() { return "get_my_watchlist"; }

    @Override
    public String description() {
        return "Kullanıcının takip listesindeki (watchlist) varlıkları döner — sembol, anlık fiyat, "
                + "günlük değişim %. 'Takip listemde ne var', 'izlediğim varlıklar' gibi sorularda kullan.";
    }

    @Override
    public Map<String, Object> parametersJsonSchema() {
        return Map.of(
                "type", "object",
                "properties", Map.of(),
                "required", List.of()
        );
    }

    @Override
    public Object execute(Map<String, Object> args) {
        List<WatchlistItemDto> items = watchlistService.getMyWatchlist();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("count", items.size());
        out.put("watchlist", items.stream().map(this::simplify).toList());
        return out;
    }

    private Map<String, Object> simplify(WatchlistItemDto w) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("symbol", w.getSymbol());
        m.put("assetType", w.getAssetType());
        m.put("currentPrice", w.getCurrentPrice());
        m.put("dailyChangePct", w.getDailyChangePct());
        return m;
    }
}
