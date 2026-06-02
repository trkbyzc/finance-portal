package com.financeportal.domains.viop.config;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Locale;

/**
 * VİOP sözleşme büyüklüğü (çarpan / multiplier) sağlayıcısı.
 *
 * VİOP'ta fiyat birim başınadır; 1 sözleşme dayanak varlığın standart bir miktarını
 * temsil eder. Nominal/pozisyon değeri = fiyat × çarpan × adet. Bu çarpanlar şimdilik
 * MOCK (temsili) değerlerdir; gerçek BİST spesifikasyonlarına göre buradan ayarlanabilir.
 *
 * Dayanak, sözleşmenin görünen adından ({@code ViopScraperClient.convertToIsYatirimFormat}
 * ile aynı mantık) tespit edilir.
 */
@Component
public class ViopContractSpec {

    private static final BigDecimal SIZE_INDEX = new BigDecimal("100");   // Endeks vadeli (BİST 30/100)
    private static final BigDecimal SIZE_FX = new BigDecimal("1000");     // Döviz vadeli (USDTRY, EURTRY, ...)
    private static final BigDecimal SIZE_METAL = BigDecimal.ONE;          // Altın/gümüş (ons/gram)
    private static final BigDecimal SIZE_EQUITY = new BigDecimal("100");  // Pay (hisse) vadeli — 1 sözleşme = 100 pay
    private static final BigDecimal SIZE_DEFAULT = BigDecimal.ONE;

    /** Sözleşmenin görünen adına göre çarpanı döndürür (mock). */
    public BigDecimal getContractSize(String displayName) {
        if (displayName == null || displayName.isBlank()) return SIZE_DEFAULT;
        String s = displayName.toUpperCase(Locale.forLanguageTag("tr-TR"));

        if (s.contains("BİST 30") || s.contains("BIST 30") || s.contains("XU030")
                || s.contains("BİST 100") || s.contains("BIST 100") || s.contains("XU100")) {
            return SIZE_INDEX;
        }
        if (s.contains("DOLAR/TL") || s.contains("USDTRY")
                || s.contains("EURO/TL") || s.contains("EURTRY")
                || s.contains("EURO/DOLAR") || s.contains("EURUSD")
                || s.contains("STERLİN") || s.contains("GBP")) {
            return SIZE_FX;
        }
        if (s.contains("ALTIN") || s.contains("XAU") || s.contains("GÜMÜŞ") || s.contains("XAG")) {
            return SIZE_METAL;
        }
        // Geri kalan: tek hisse (pay) vadeli sözleşmeleri
        return SIZE_EQUITY;
    }
}
