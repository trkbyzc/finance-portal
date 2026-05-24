package com.financeportal.model.dto.market;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CurrencyRateDto {
    private String currencyCode; // Örn: USD, EUR
    private String currencyName; // Örn: ABD Doları

    // 🚀 HESAPKURDU'NDAKİ 'bid' VE 'ask' DEĞERLERİ BURAYA MAPLENİR
    private BigDecimal forexBuying;  // Alış (bid)
    private BigDecimal forexSelling; // Satış (ask)
    private BigDecimal changePercent;

    // 🚀 BANKA / DÖVİZ BÜROSU BİLGİLERİ
    private String bankName;      // Örn: Garanti BBVA, Akbank, Harem Döviz
    private String exchangeType;  // Örn: "Bank" veya "ExchOffice" (Serbest Piyasa ayrımı için)

    // 🚀 META VERİLER
    private String yahooSymbol;   // Örn: TRY=X
    private String chartType;     // "LINE" veya "CANDLE"
    private String assetCategory; // "BANK_CURRENCY", "CURRENCY", "CRYPTO"

    // TARİHSEL DEĞİŞİM VERİLERİ (EVDS'DEN GELENLER)
    private BigDecimal changeWeek;
    private BigDecimal changeMonth;
    private BigDecimal change6Month;
    private BigDecimal changeYear;
    private BigDecimal change5Year;
}