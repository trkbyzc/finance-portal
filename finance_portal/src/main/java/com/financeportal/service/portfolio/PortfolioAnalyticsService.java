package com.financeportal.service.portfolio;

import com.financeportal.model.dto.portfolio.AssetDistributionDto;
import com.financeportal.model.dto.portfolio.PortfolioItemDto;
import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.model.entity.PortfolioItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PortfolioAnalyticsService {

    private final PortfolioPriceService priceService;

    public List<PortfolioItemDto> buildPortfolioItems(List<PortfolioItem> items) {
        return items.stream().map(item -> {
            BigDecimal totalCost = item.getQuantity().multiply(item.getAveragePrice());
            BigDecimal currentPrice = priceService.getCurrentPrice(item.getSymbol(), item.getAssetType());
            BigDecimal currentValue = item.getQuantity().multiply(currentPrice);
            BigDecimal profitLoss = currentValue.subtract(totalCost);
            BigDecimal profitLossPct = BigDecimal.ZERO;

            if (totalCost.compareTo(BigDecimal.ZERO) > 0) {
                profitLossPct = profitLoss.divide(totalCost, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
            }

            return new PortfolioItemDto(item.getSymbol(), item.getAssetType().name(), item.getQuantity(),
                    item.getAveragePrice(), totalCost, currentPrice, currentValue, profitLoss, profitLossPct);
        }).collect(Collectors.toList());
    }

    public PortfolioSummaryDto buildPortfolioSummary(List<PortfolioItem> items) {
        BigDecimal totalAssetCost = BigDecimal.ZERO;
        BigDecimal totalAssetValue = BigDecimal.ZERO;
        List<AssetDistributionDto> distribution = new ArrayList<>();

        for (PortfolioItem item : items) {
            BigDecimal itemCost = item.getQuantity().multiply(item.getAveragePrice());
            BigDecimal currentPrice = priceService.getCurrentPrice(item.getSymbol(), item.getAssetType());
            BigDecimal itemValue = item.getQuantity().multiply(currentPrice);

            totalAssetCost = totalAssetCost.add(itemCost);
            totalAssetValue = totalAssetValue.add(itemValue);
            distribution.add(new AssetDistributionDto(item.getSymbol(), itemValue, BigDecimal.ZERO));
        }

        if (totalAssetValue.compareTo(BigDecimal.ZERO) > 0) {
            for (AssetDistributionDto dist : distribution) {
                if (dist.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal pct = dist.getAmount().divide(totalAssetValue, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
                    dist.setPercentage(pct);
                }
            }
        }

        BigDecimal totalProfitLoss = totalAssetValue.subtract(totalAssetCost);
        BigDecimal totalProfitLossPct = BigDecimal.ZERO;

        if (totalAssetCost.compareTo(BigDecimal.ZERO) > 0) {
            totalProfitLossPct = totalProfitLoss.divide(totalAssetCost, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
        }

        PortfolioSummaryDto summary = new PortfolioSummaryDto();
        summary.setTotalAssetCost(totalAssetCost);
        summary.setTotalAssetValue(totalAssetValue);
        summary.setGrandTotal(totalAssetValue);
        summary.setTotalProfitLoss(totalProfitLoss);
        summary.setTotalProfitLossPct(totalProfitLossPct);
        summary.setDistribution(distribution);

        return summary;
    }
}
