package com.financeportal.model.dto.fintables;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FintablesChartResponse {
    private String s; // "ok" veya "no_data" döner
    private List<Long> t; // Zaman damgaları (Timestamp)
    private List<BigDecimal> c; // Kapanış (Close) fiyatları

    // 🚀 AŞAĞIDAKİLER EKSİKTİ, BUNLARI EKLEYİN:
    private List<BigDecimal> o; // Açılış (Open) fiyatları
    private List<BigDecimal> h; // En yüksek (High) fiyatlar
    private List<BigDecimal> l; // En düşük (Low) fiyatlar
    private List<Long> v;       // Hacim (Volume)
}