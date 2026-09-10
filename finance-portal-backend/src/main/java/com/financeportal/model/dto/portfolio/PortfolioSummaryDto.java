package com.financeportal.model.dto.portfolio;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class PortfolioSummaryDto {
    private BigDecimal totalAssetCost;
    private BigDecimal totalAssetValue;
    private BigDecimal grandTotal;

    private BigDecimal totalProfitLoss;
    private BigDecimal totalProfitLossPct;

    private List<AssetDistributionDto> distribution;
}
