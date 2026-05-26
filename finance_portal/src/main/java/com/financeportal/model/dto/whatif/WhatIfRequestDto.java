package com.financeportal.model.dto.whatif;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WhatIfRequestDto {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate investmentDate;

    private BigDecimal amountTry;

    private List<WhatIfAssetRef> assets;
}
