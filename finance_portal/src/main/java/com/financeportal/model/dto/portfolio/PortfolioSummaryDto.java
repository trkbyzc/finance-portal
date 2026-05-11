package com.financeportal.model.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class PortfolioSummaryDto {
    private BigDecimal totalCash;
    private BigDecimal totalAssetCost;  // Varlıkların Bize Maliyeti
    private BigDecimal totalAssetValue; // Varlıkların GÜNCEL Değeri
    private BigDecimal grandTotal;      // Nakit + Güncel Varlık Değeri

    // -- YENİ EKLENEN (TOPLAM GETİRİ) --
    private BigDecimal totalProfitLoss;    // Toplam Kar/Zarar (TL)
    private BigDecimal totalProfitLossPct; // Toplam Kar/Zarar (%)

    private List<AssetDistributionDto> distribution;
}