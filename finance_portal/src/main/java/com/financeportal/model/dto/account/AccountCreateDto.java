package com.financeportal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AccountCreateDto {
    private UUID userId;
    @NotBlank(message = "Hesap adı boş olamaz.")
    private String accountName;
    @NotNull(message = "Bakiye boş olamaz.")
    @PositiveOrZero(message = "Başlangıç bakiyesi sıfır veya büyük olmalıdır.")
    private BigDecimal balance;
    @NotBlank(message = "Para birimi boş olamaz.")
    private String currency;
}