package com.financeportal.model.dto.fintables;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FintablesYieldResult {
    private String code;
    private String title;
    private BigDecimal yield_1m; // 1 Aylık Getiriyi kullanacağız
    private BigDecimal price;
}