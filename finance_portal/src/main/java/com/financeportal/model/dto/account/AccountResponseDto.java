package com.financeportal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponseDto {
    private UUID id;
    private String accountName;
    private BigDecimal balance;
    private String currency;
    private UUID userId;

    // Yeni eklenen alanlar
    private String accountType;
    private BigDecimal interestRate;
    private LocalDateTime maturityDate;
}