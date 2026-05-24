package com.financeportal.model.dto.portfolio;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PortfolioItemDto {
    private String symbol;
    private String assetType;
    private BigDecimal quantity;
    private BigDecimal averagePrice;    // Maliyetimiz (Alış)
    private BigDecimal totalCost;       // Adet * Maliyet (Toplam Maliyet)

    // -- YENİ EKLENEN (İSTERLER 4. MADDE) --
    private BigDecimal currentPrice;    // Anlık Piyasa Fiyatı
    private BigDecimal currentValue;    // Güncel Değer (Adet * Anlık Fiyat)
    private BigDecimal profitLoss;      // Kar/Zarar (TL bazlı)
    private BigDecimal profitLossPct;   // Kar/Zarar (Yüzde bazlı)
}