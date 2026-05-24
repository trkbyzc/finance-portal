package com.financeportal.domains.viop.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ViopDto {
    private String symbol;
    private String name;
    private String assetType;
    private BigDecimal price;
    private BigDecimal changePercent;
    private Long volume;
    private String yahooSymbol;
    private String chartType;
    private String assetCategory;
}