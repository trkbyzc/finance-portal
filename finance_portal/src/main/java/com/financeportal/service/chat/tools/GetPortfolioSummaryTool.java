package com.financeportal.service.chat.tools;

import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.service.portfolio.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Portföyün özet metrikleri — toplam maliyet, güncel değer, toplam kar/zarar.
 * Kullanıcı "ne kadar kazandım", "portföyüm kaç para" tipi sorular sorduğunda.
 */
@Component
@RequiredArgsConstructor
public class GetPortfolioSummaryTool implements ChatTool {

    private final PortfolioService portfolioService;

    @Override
    public String name() { return "get_portfolio_summary"; }

    @Override
    public String description() {
        return "Kullanıcının portföyünün özetini döner: toplam maliyet, güncel değer, "
                + "toplam kar/zarar (TL ve %). 'Portföyüm ne kadar', 'kar mı zarar mı', "
                + "'toplam değerim' gibi sorularda kullan.";
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
        PortfolioSummaryDto s = portfolioService.getMyPortfolioSummary(null);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalCost", s.getTotalAssetCost());
        out.put("totalValue", s.getTotalAssetValue());
        out.put("grandTotal", s.getGrandTotal());
        out.put("totalProfitLoss", s.getTotalProfitLoss());
        out.put("totalProfitLossPct", s.getTotalProfitLossPct());
        out.put("distribution", s.getDistribution());
        return out;
    }
}
