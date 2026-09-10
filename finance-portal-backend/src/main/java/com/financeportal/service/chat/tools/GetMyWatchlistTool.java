package com.financeportal.service.chat.tools;

import com.financeportal.model.dto.watchlist.WatchlistItemDto;
import com.financeportal.service.watchlist.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GetMyWatchlistTool implements ChatToolBean {

    private final WatchlistService watchlistService;

    @Tool(name = "get_my_watchlist", description = "Kullanıcının takip listesindeki (watchlist) varlıkları döner — sembol, anlık fiyat, "
                + "günlük değişim %. 'Takip listemde ne var', 'izlediğim varlıklar' gibi sorularda kullan.")
    public Object myWatchlist() {
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
