package com.financeportal.model.dto.market;

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
    private BigDecimal price;      // satış (ask) fiyatı
    private BigDecimal buyPrice;   // alış (bid) fiyatı
    private BigDecimal changePercent;
    private Long volume;

    private String yahooSymbol;
    private String chartType;
    private String assetCategory;

    private boolean inBist30;
    private boolean inBist50;
    private boolean inBist100;

    // Geriye dönük uyumluluk: 6 parametreli eski çağrı noktalarının derlenmesi için korunuyor.
    public MarketAssetDto(String symbol, String name, String assetType, BigDecimal price, BigDecimal changePercent, Long volume) {
        this.symbol = symbol;
        this.name = name;
        this.assetType = assetType;
        this.price = price;
        this.changePercent = changePercent;
        this.volume = volume;
    }
}