package com.financeportal.domains.economy.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EconomyDto {
    private Double interestRate;
    private Double inflationRate;
    private Double unemploymentRate;
    private String lastUpdated;
}