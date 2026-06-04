package com.financeportal.domains.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Hisse detay sayfası "Temel Veriler" kartı için özet veri.
 *
 * Kaynaklar:
 *   - Yahoo chart meta (auth gerektirmez): 52 hafta / gün içi aralık, hacim, önceki kapanış, para birimi, ad.
 *   - İş Yatırım "Temel Değerler" Özet tablosu: piyasa değeri (₺/$), halka açıklık %, sermaye, sektör (BİST).
 *
 * Eksik alanlar null kalır (frontend "—" gösterir) — kaynak başarısızsa sayfa bozulmaz.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockFundamentalsDto {
    private String symbol;
    private String longName;
    private String sector;       // İş Yatırım (örn. "Savunma", "Banka")
    private String currency;     // Yahoo (örn. "TRY")

    // Yahoo chart meta
    private Double price;
    private Double previousClose;
    private Double dayLow;
    private Double dayHigh;
    private Double week52Low;
    private Double week52High;
    private Long volume;

    // İş Yatırım Özet
    private Double marketCapTl;   // gerçek TL (mn TL × 1e6)
    private Double marketCapUsd;  // gerçek USD (mn $ × 1e6)
    private Double freeFloatPct;  // halka açıklık %
    private Double capital;       // ödenmiş sermaye (TL)
}
