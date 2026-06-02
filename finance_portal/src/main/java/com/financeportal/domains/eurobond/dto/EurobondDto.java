package com.financeportal.domains.eurobond.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Türkiye Hazine eurobondu — businessinsider.com'dan çekilen tekil bono.
 *
 * symbol = ISIN (örn. "US900123DV94"); frontend listesi ve grafik route'u (?cat=EUROBOND)
 * bu sembolle çalışır. tkData businessinsider grafik endpoint'i için taşınır
 * (EurobondChartStrategy isin→tkData çözümünde kullanır).
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class EurobondDto {
    private String symbol;        // = ISIN
    private String isin;
    private String name;          // örn. "Türkiye %6.375 2031 (USD)"
    private String currency;      // "USD" / "EUR"
    private BigDecimal coupon;    // kupon oranı (%)
    private String maturity;      // vade tarihi "yyyy-MM-dd"
    @JsonProperty("yield")
    private BigDecimal bondYield;  // getiri (%) — JSON'da "yield" olarak serialize edilir (frontend coin.yield okur)
    private BigDecimal price;     // güncel temiz fiyat
    private BigDecimal changePercent; // günlük değişim (%)
    private String tkData;        // businessinsider grafik kimliği "1,<id>,<type>,<market>"

    private String chartType;     // "LINE"
    private String assetCategory; // "EUROBOND"
}
