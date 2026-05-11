package com.financeportal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class InterestYieldDto {
    private String bankName;         // Örn: Akbank
    private double annualRate;       // Örn: 54.00
    private BigDecimal netYield;     // Örn: 4438.35 (Net kazanç)
    private BigDecimal totalPayment; // Örn: 104438.35 (Ana para + Kazanç)
}