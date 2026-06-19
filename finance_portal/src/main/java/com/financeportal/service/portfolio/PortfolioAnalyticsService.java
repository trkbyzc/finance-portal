package com.financeportal.service.portfolio;

import com.financeportal.domains.viop.config.ViopContractSpec;
import com.financeportal.domains.viop.config.ViopMath;
import com.financeportal.model.dto.portfolio.AssetDistributionDto;
import com.financeportal.model.dto.portfolio.PortfolioItemDto;
import com.financeportal.model.dto.portfolio.PortfolioSummaryDto;
import com.financeportal.model.entity.PortfolioItem;
import com.financeportal.model.enums.AssetType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PortfolioAnalyticsService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final PortfolioPriceService priceService;
    private final ViopContractSpec viopContractSpec;

    public List<PortfolioItemDto> buildPortfolioItems(List<PortfolioItem> items) {
        return items.stream().map(item -> {
            Valuation v = valuate(item);
            PortfolioItemDto dto = new PortfolioItemDto(item.getSymbol(), item.getAssetType().name(),
                    item.getQuantity(), item.getAveragePrice(), v.multiplier(), v.cost(),
                    v.currentPrice(), v.value(), v.pnl(), v.pct());
            // VİOP uzantı alanları yalnızca FUTURE pozisyonlarda doldurulur (frontend yön/teminat/kaldıraç göstersin).
            if (v.direction() != null) {
                dto.setDirection(v.direction());
                dto.setNotional(v.notional());
                dto.setMarginPosted(v.marginPosted());
                dto.setLeverage(v.leverage());
            }
            return dto;
        }).toList();
    }

    public PortfolioSummaryDto buildPortfolioSummary(List<PortfolioItem> items) {
        BigDecimal totalAssetCost = BigDecimal.ZERO;
        BigDecimal totalAssetValue = BigDecimal.ZERO;
        List<AssetDistributionDto> distribution = new ArrayList<>();

        for (PortfolioItem item : items) {
            Valuation v = valuate(item);
            totalAssetCost = totalAssetCost.add(v.cost());
            totalAssetValue = totalAssetValue.add(v.value());
            // Dağılımda VİOP pozisyonu notional'ı değil portföye KATKISI (teminat + K/Z) ile yer alır.
            distribution.add(new AssetDistributionDto(item.getSymbol(), v.value(), BigDecimal.ZERO));
        }

        if (totalAssetValue.compareTo(BigDecimal.ZERO) > 0) {
            for (AssetDistributionDto dist : distribution) {
                if (dist.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal pct = dist.getAmount().divide(totalAssetValue, 4, RoundingMode.HALF_UP).multiply(HUNDRED);
                    dist.setPercentage(pct);
                }
            }
        }

        BigDecimal totalProfitLoss = totalAssetValue.subtract(totalAssetCost);
        BigDecimal totalProfitLossPct = BigDecimal.ZERO;

        if (totalAssetCost.compareTo(BigDecimal.ZERO) > 0) {
            totalProfitLossPct = totalProfitLoss.divide(totalAssetCost, 4, RoundingMode.HALF_UP).multiply(HUNDRED);
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

    /** Bir pozisyonun maliyet/değer/K-Z değerlemesi — VİOP ve spot için tek doğruluk kaynağı. */
    private Valuation valuate(PortfolioItem item) {
        BigDecimal multiplier = item.getContractSize() != null ? item.getContractSize() : BigDecimal.ONE;
        BigDecimal currentPrice = priceService.getCurrentPrice(item.getSymbol(), item.getAssetType());
        BigDecimal qty = item.getQuantity();
        BigDecimal entry = item.getAveragePrice();

        if (item.getAssetType() == AssetType.FUTURE) {
            // VİOP: tam nominal değil TEMİNAT bağlanır. Portföye katkı = teminat + K/Z (notional DEĞİL);
            // getiri yüzdesi de bağlanan teminata göre ölçülür → gerçek kaldıraçlı getiri.
            BigDecimal marginRate = viopContractSpec.getSpec(item.getSymbol()).marginRate();
            int dirSign = ViopMath.dirSign(item.getDirection());
            BigDecimal notional = ViopMath.notional(qty, currentPrice, multiplier);
            BigDecimal marginPosted = ViopMath.marginPosted(qty, entry, multiplier, marginRate);
            BigDecimal pnl = ViopMath.pnl(qty, entry, currentPrice, multiplier, dirSign);
            BigDecimal leverage = ViopMath.leverage(notional, marginPosted);
            BigDecimal pct = marginPosted.signum() > 0
                    ? pnl.divide(marginPosted, 4, RoundingMode.HALF_UP).multiply(HUNDRED)
                    : BigDecimal.ZERO;
            String direction = item.getDirection() != null ? item.getDirection() : "LONG";
            return new Valuation(marginPosted, marginPosted.add(pnl), pnl, pct, currentPrice, multiplier,
                    direction, notional, marginPosted, leverage);
        }

        // Spot (çarpan VİOP dışında 1): tam tutar ödenir.
        BigDecimal cost = qty.multiply(entry).multiply(multiplier);
        BigDecimal value = qty.multiply(currentPrice).multiply(multiplier);
        BigDecimal pnl = value.subtract(cost);
        BigDecimal pct = cost.signum() > 0
                ? pnl.divide(cost, 4, RoundingMode.HALF_UP).multiply(HUNDRED)
                : BigDecimal.ZERO;
        return new Valuation(cost, value, pnl, pct, currentPrice, multiplier, null, null, null, null);
    }

    /** Değerleme sonucu (VİOP alanları spot pozisyonlarda null). */
    private record Valuation(BigDecimal cost, BigDecimal value, BigDecimal pnl, BigDecimal pct,
                             BigDecimal currentPrice, BigDecimal multiplier,
                             String direction, BigDecimal notional, BigDecimal marginPosted, BigDecimal leverage) {}
}
