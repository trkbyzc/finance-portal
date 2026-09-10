package com.financeportal.model.dto.simulation;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.financeportal.model.enums.AssetType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulationCreateRequestDto {

    private String symbol;
    private AssetType assetType;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate investmentDate;

    private BigDecimal amountTry;
    private String notes;
}
