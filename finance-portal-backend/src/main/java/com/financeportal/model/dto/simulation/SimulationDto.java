package com.financeportal.model.dto.simulation;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.financeportal.model.enums.AssetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationDto {

    private UUID id;
    private String symbol;
    private AssetType assetType;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate investmentDate;

    private BigDecimal amountTry;
    private String notes;
    private LocalDateTime createdAt;

    /** Anlık hesaplanan sonuç (DB'de saklanmaz, her okumada compute edilir). */
    private SimulationResultDto result;
}
