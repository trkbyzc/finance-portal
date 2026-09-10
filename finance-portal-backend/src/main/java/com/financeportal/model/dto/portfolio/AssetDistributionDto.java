package com.financeportal.model.dto.portfolio;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class AssetDistributionDto {
    private String assetName;   // "Nakit (TRY)", "THYAO.IS", "BTC" vb.
    private BigDecimal amount;  // TL Karşılığı (Örn: 1500 TL)
    private BigDecimal percentage; // Pastadaki yüzdesi (Örn: %25.50)
}