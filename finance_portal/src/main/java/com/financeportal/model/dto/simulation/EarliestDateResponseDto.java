package com.financeportal.model.dto.simulation;

import com.financeportal.model.enums.AssetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EarliestDateResponseDto {
    private String symbol;
    private AssetType assetType;
    private LocalDate earliestDate;
}
