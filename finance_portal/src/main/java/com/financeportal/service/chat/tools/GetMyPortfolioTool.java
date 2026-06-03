package com.financeportal.service.chat.tools;

import com.financeportal.model.dto.portfolio.PortfolioItemDto;
import com.financeportal.service.portfolio.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Kullanıcının varsayılan (ilk) portföyündeki holding listesi.
 * Argüman yok — current user'ın default portföyü dönülür.
 */
@Component
@RequiredArgsConstructor
public class GetMyPortfolioTool implements ChatTool {

    private final PortfolioService portfolioService;

    @Override
    public String name() { return "get_my_portfolio"; }

    @Override
    public String description() {
        return "Kullanıcının portföyündeki tüm varlıkları (sembol, miktar, ortalama maliyet, "
                + "anlık fiyat, kar/zarar) döner. Kullanıcı 'portföyümde ne var', 'hangi hisseler', "
                + "'kar mı zarar mı' gibi sorular sorduğunda bu tool'u çağır.";
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
        // Default portfolio (portfolioId=null → service default'u çözer)
        List<PortfolioItemDto> items = portfolioService.getMyPortfolio(null);
        List<Map<String, Object>> simplified = items.stream()
                .map(this::simplify)
                .toList();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("count", items.size());
        out.put("holdings", simplified);
        return out;
    }

    private Map<String, Object> simplify(PortfolioItemDto i) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("symbol", i.getSymbol());
        m.put("assetType", i.getAssetType());
        m.put("quantity", i.getQuantity());
        m.put("averagePrice", i.getAveragePrice());
        m.put("currentPrice", i.getCurrentPrice());
        m.put("currentValue", i.getCurrentValue());
        m.put("profitLoss", i.getProfitLoss());
        m.put("profitLossPct", i.getProfitLossPct());
        return m;
    }
}
