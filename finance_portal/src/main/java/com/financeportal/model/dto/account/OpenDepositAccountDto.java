package com.financeportal.model.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class OpenDepositAccountDto {

    @NotNull(message = "Kaynak hesap ID boş olamaz")
    private UUID sourceAccountId;

    @NotNull(message = "Tutar boş olamaz")
    @DecimalMin(value = "100.0", message = "Vadeli hesap açmak için en az 100 birim gereklidir")
    private BigDecimal amount;

    @Min(value = 1, message = "Vade süresi en az 1 gün olmalıdır")
    private int durationInDays; // Kaç günlük vade? (Örn: 32)

    @NotNull(message = "Faiz oranı boş olamaz")
    private BigDecimal interestRate; // Yıllık faiz oranı (Örn: 45.0)
}