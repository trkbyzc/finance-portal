package com.financeportal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransferRequestDto {
    private UUID fromAccountId;
    private UUID toAccountId;
    private BigDecimal amount;
    private String description;
}