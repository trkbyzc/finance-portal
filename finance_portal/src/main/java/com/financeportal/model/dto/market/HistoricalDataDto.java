package com.financeportal.model.dto.market;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // 🚀 BUNU EKLEDİK
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true) // 🚀 İŞTE HAYAT KURTARAN O SİHİRLİ SATIR
public class HistoricalDataDto {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    private Long timestamp;
    private BigDecimal open;
    private BigDecimal high;
    private BigDecimal low;
    private BigDecimal close; // Python'dan gelen değer buraya otomatik maplenecek
    private BigDecimal price;
    private Long volume;
    private BigDecimal movingAverage;
}