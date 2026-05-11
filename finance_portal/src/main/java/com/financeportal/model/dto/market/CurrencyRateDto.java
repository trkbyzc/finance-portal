package com.financeportal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CurrencyRateDto {
    private String currencyCode; // Saf sembol: BTC
    private String currencyName;
    private BigDecimal forexBuying;
    private BigDecimal forexSelling;
    private BigDecimal changePercent;

    // 🚀 META VERİ ALANLARI: Frontend'in ameleliğini bitiren kısım
    private String yahooSymbol;  // Yahoo'nun anlayacağı format: BTC-USD, THYAO.IS
    private String chartType;    // "CANDLE" (Mum) veya "LINE" (Çizgi)
    private String assetCategory; // "CRYPTO", "STOCK", "INDEX", "BOND"

    // GERÇEK ZAMANLI VERİ ALANLARI
    private BigDecimal changeWeek;
    private BigDecimal changeMonth;
    private BigDecimal change6Month;
    private BigDecimal changeYear;
    private BigDecimal change5Year;
}