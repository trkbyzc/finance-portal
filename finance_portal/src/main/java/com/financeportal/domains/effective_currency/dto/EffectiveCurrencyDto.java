package com.financeportal.domains.effective_currency.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Efektif döviz kuru DTO'su. TCMB XML'inde her Currency element'i için
 * BanknoteBuying / BanknoteSelling alanları "efektif" (nakit/banknot) tarafa karşılık gelir.
 * <p>
 * Field adları normal {@code CurrencyDto} ile özdeş (forexBuying/forexSelling) tutuldu —
 * frontend rendering kodu (CurrencyTable vb.) hiçbir değişiklik gerektirmesin diye. Sadece
 * veri kaynağı (TCMB Banknote* + EVDS *.EF.* serileri) farklı.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EffectiveCurrencyDto {
    private String currencyCode;
    private String currencyName;
    private BigDecimal forexBuying;
    private BigDecimal forexSelling;
    private BigDecimal changePercent;
    private String yahooSymbol;
    private String chartType;
    private String assetCategory;
    private BigDecimal changeWeek;
    private BigDecimal changeMonth;
    private BigDecimal change6Month;
    private BigDecimal changeYear;
    private BigDecimal change5Year;
}
