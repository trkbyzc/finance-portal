package com.financeportal.model.dto.market;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true) // Upstream API yanıtlarındaki ekstra alanlar deserializasyonu bozmasın
public class HistoricalDataDto {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    private Long timestamp;
    private BigDecimal open;
    private BigDecimal high;
    private BigDecimal low;
    private BigDecimal close;
    private BigDecimal price;
    private Long volume;
    private BigDecimal movingAverage;
}