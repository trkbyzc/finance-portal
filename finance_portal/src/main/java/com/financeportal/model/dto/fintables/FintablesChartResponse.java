package com.financeportal.model.dto.fintables;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FintablesChartResponse {
    private String s; // 🚀 "ok" veya "no_data" döner
    private List<Long> t; // Zaman damgaları
    private List<BigDecimal> c; // Kapanış fiyatları
}