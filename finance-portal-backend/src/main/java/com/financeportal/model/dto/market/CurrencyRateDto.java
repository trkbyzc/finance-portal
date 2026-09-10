package com.financeportal.model.dto.market;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CurrencyRateDto {
    private String currencyCode;
    private String currencyName;

    // Kaynak feed'deki bid/ask değerleri bu alanlara map edilir
    private BigDecimal forexBuying;  // Alış (bid)
    private BigDecimal forexSelling; // Satış (ask)
    private BigDecimal changePercent;

    private String bankName;      // Örn: Garanti BBVA, Akbank, Harem Döviz
    private String exchangeType;  // "Bank" veya "ExchOffice" — banka vs. serbest piyasa ayrımı

    private String yahooSymbol;   // Örn: TRY=X
    private String chartType;
    private String assetCategory; // "BANK_CURRENCY", "CURRENCY", "CRYPTO"

    // EVDS'den gelen tarihsel değişim yüzdeleri
    private BigDecimal changeWeek;
    private BigDecimal changeMonth;
    private BigDecimal change6Month;
    private BigDecimal changeYear;
    private BigDecimal change5Year;
}