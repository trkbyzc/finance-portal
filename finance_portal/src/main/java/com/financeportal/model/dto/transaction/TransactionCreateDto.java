package com.financeportal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransactionCreateDto {
    @NotNull(message = "Hesap ID boş olamaz.")
    private UUID accountId;

    @NotNull(message = "İşlem tutarı boş olamaz.")
    @Positive(message = "İşlem tutarı sıfırdan büyük olmalıdır.")
    private BigDecimal amount;

    @NotBlank(message = "İşlem tipi boş olamaz.")
    private String transactionType;

    private String description;
}