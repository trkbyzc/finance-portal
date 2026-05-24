package com.financeportal.domains.bank_currency.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BankCurrencyDto {
    private String currencyCode;
    private String currencyName;
    private BigDecimal forexBuying;
    private BigDecimal forexSelling;
    private BigDecimal changePercent;
    private String bankName;
    private String exchangeType;
    private String yahooSymbol;
    private String chartType;
    private String assetCategory;
}