package com.financeportal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MarketAssetDto {
    private String symbol;
    private String name;
    private String assetType;
    private BigDecimal price;      // SATIŞ FİYATI
    private BigDecimal buyPrice;   // 🚀 YENİ EKLENDİ: GERÇEK ALIŞ FİYATI
    private BigDecimal changePercent;
    private Long volume;

    // 🚀 OTOMASYON ALANLARI
    private String yahooSymbol;
    private String chartType;
    private String assetCategory;

    // 🚀 HAYAT KURTARAN CONSTRUCTOR
    // Sistemin başka yerlerinde hala eski usul (6 parametreli) obje oluşturan
    // kodların patlamaması için bu özel constructor'ı ekliyoruz.
    public MarketAssetDto(String symbol, String name, String assetType, BigDecimal price, BigDecimal changePercent, Long volume) {
        this.symbol = symbol;
        this.name = name;
        this.assetType = assetType;
        this.price = price;
        this.changePercent = changePercent;
        this.volume = volume;
    }
}