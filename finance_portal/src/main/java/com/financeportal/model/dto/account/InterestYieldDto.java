package com.financeportal.model.dto.account;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class InterestYieldDto {
    private String bankName;
    private double annualRate;
    private BigDecimal netYield;
    private BigDecimal totalPayment;
}