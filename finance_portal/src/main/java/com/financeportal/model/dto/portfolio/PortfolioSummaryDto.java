package com.financeportal.model.dto.portfolio;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class PortfolioSummaryDto {
    private BigDecimal totalAssetCost;  // Varlıkların Bize Maliyeti
    private BigDecimal totalAssetValue; // Varlıkların GÜNCEL Değeri
    private BigDecimal grandTotal;      // Toplam Güncel Değer

    private BigDecimal totalProfitLoss;    // Toplam Kar/Zarar (TL)
    private BigDecimal totalProfitLossPct; // Toplam Kar/Zarar (%)

    private List<AssetDistributionDto> distribution;
}
