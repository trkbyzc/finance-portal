package com.financeportal.domains.bond.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BondDto {
    private String symbol;
    private String name;
    private String assetType;
    private BigDecimal price;
    private BigDecimal changePercent;
    private String yahooSymbol;
    private String assetCategory;
}