package com.financeportal.service.portfolio;

import com.financeportal.domains.bond.config.BondMath;
import com.financeportal.domains.bond.config.BondSpec;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PortfolioAnalyticsService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final PortfolioPriceService priceService;
    private final ViopContractSpec viopContractSpec;
    private final BondSpec bondSpec;

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

        if (item.getAssetType() == AssetType.BOND) {
            return valuateBond(item, qty, entry, currentPrice);
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

    /**
     * Sabit getirili (tahvil/bono/eurobond) değerleme — hisse gibi adet×fiyat DEĞİL.
     *
     * <p>Nominal (face) = quantity. DİBS getiri-kotalı: saklı averagePrice = giriş getirisi, anlık
     * fiyat = güncel getiri; ikisi de BondMath ile temiz fiyata çevrilir → değer = nominal × temizFiyat/100.
     * Getiri ↓ → fiyat ↑. Kupon FIXED ise gerçek nominal kupon, ZERO ise sıfır-kupon iskonto, REAL ise
     * par-at-entry (kupon = giriş getirisi). Eurobond fiyat-kotalı: saklı = temiz fiyat (USD).
     *
     * <p>Para birimi dönüşümü (USD→TRY) frontend'de yapılır (backend native değer döndürür, spot/VİOP gibi).
     * Fiyat sütunlarında getiri/fiyat gösterilir; değer ve K/Z temiz-fiyat bazlıdır.
     */
    private Valuation valuateBond(PortfolioItem item, BigDecimal qty, BigDecimal entry, BigDecimal current) {
        BondSpec.BondInfo info = bondSpec.forSymbol(item.getSymbol(), null);
        double face = qty != null ? qty.doubleValue() : 0.0;
        double entryQuote = entry != null ? entry.doubleValue() : 0.0;       // DİBS: giriş getirisi · Eurobond: giriş temiz fiyatı
        double currentQuote = current != null ? current.doubleValue() : 0.0; // DİBS: güncel getiri · Eurobond: güncel temiz fiyat

        double entryClean, currentClean;
        BigDecimal displayPrice; // fiyat sütununda gösterilecek (DİBS → getiri, eurobond → fiyat)

        if (info.kind() == BondSpec.Kind.EUROBOND) {
            // Fiyat-kotalı: quote zaten temiz fiyat (%). Anlık fiyat yoksa girişe düş.
            entryClean = entryQuote;
            currentClean = currentQuote > 0 ? currentQuote : entryQuote;
            displayPrice = BigDecimal.valueOf(currentClean);
        } else {
            // DİBS / INDEX: getiri-kotalı → temiz fiyata çevir.
            double currentYield = currentQuote > 0 ? currentQuote : entryQuote; // fiyat yoksa değişim yok
            double coupon;
            if ("FIXED".equals(info.couponType()) && info.coupon() != null) coupon = info.coupon().doubleValue();
            else if ("ZERO".equals(info.couponType())) coupon = 0.0;
            else coupon = entryQuote; // REAL / bilinmeyen → par-at-entry (kupon ≈ giriş getirisi)
            double years = info.maturity() != null ? BondMath.yearsBetween(LocalDate.now(), info.maturity()) : 0.0;
            entryClean = BondMath.cleanPriceFromYield(entryQuote, coupon, years);
            currentClean = BondMath.cleanPriceFromYield(currentYield, coupon, years);
            displayPrice = BigDecimal.valueOf(currentYield); // fiyat sütununda güncel getiri
        }

        BigDecimal cost = BigDecimal.valueOf(face * entryClean / 100.0);
        BigDecimal value = BigDecimal.valueOf(face * currentClean / 100.0);
        BigDecimal pnl = value.subtract(cost);
        BigDecimal pct = cost.signum() > 0
                ? pnl.divide(cost, 4, RoundingMode.HALF_UP).multiply(HUNDRED)
                : BigDecimal.ZERO;
        return new Valuation(cost, value, pnl, pct, displayPrice, BigDecimal.ONE, null, null, null, null);
    }

    /** Değerleme sonucu (VİOP alanları spot pozisyonlarda null). */
    private record Valuation(BigDecimal cost, BigDecimal value, BigDecimal pnl, BigDecimal pct,
                             BigDecimal currentPrice, BigDecimal multiplier,
                             String direction, BigDecimal notional, BigDecimal marginPosted, BigDecimal leverage) {}
}
