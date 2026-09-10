package com.financeportal.domains.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockDto {
    private String symbol;
    private String name;
    private String assetType;
    private BigDecimal price;
    private BigDecimal buyPrice;
    private BigDecimal changePercent;
    private Long volume;
    private String yahooSymbol;
    private String chartType;
    private String assetCategory;
    private boolean inBist30;
    private boolean inBist50;
    private boolean inBist100;
    private String image;   // TradingView logo URL'i (BistLogoClient); yoksa null → frontend sembol baş harflerine düşer
}