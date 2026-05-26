package com.financeportal.model.dto.portfolio;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.financeportal.model.enums.AssetType;
import com.financeportal.model.enums.TradeSide;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDto {
    private UUID id;
    private String symbol;
    private AssetType assetType;
    private TradeSide side;
    private BigDecimal quantity;
    private BigDecimal price;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime executedAt;

    private String notes;
}
