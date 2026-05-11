package com.financeportal.model.dto;

import com.financeportal.model.entity.Transaction;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransactionResponseDto {
    private UUID id;
    private UUID accountId;
    private BigDecimal amount;
    private String transactionType;
    private String description;
    private LocalDateTime transactionDate;

    // Entity'den DTO'ya hızlı dönüşüm için manuel constructor
    public TransactionResponseDto(Transaction transaction) {
        this.id = transaction.getId();
        this.accountId = transaction.getAccount().getId();
        this.amount = transaction.getAmount();
        this.transactionType = transaction.getTransactionType();
        this.description = transaction.getDescription();
        this.transactionDate = transaction.getTransactionDate();
    }
}