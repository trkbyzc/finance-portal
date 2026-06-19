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

    /** VİOP sözleşme metadata'sı: çarpan, başlangıç teminat oranı, para birimi. */
    public record ViopSpec(BigDecimal multiplier, BigDecimal marginRate, String currency) {}

    // multiplier · başlangıç teminat oranı (mock — gerçek BİST oranlarına göre ayarlanabilir) · para birimi
    private static final ViopSpec INDEX     = new ViopSpec(new BigDecimal("100"),  new BigDecimal("0.10"), "TRY"); // BİST 30/100
    private static final ViopSpec FX_TRY    = new ViopSpec(new BigDecimal("1000"), new BigDecimal("0.06"), "TRY"); // USDTRY, EURTRY
    private static final ViopSpec FX_USD    = new ViopSpec(new BigDecimal("1000"), new BigDecimal("0.06"), "USD"); // EURUSD, GBPUSD
    private static final ViopSpec METAL_USD = new ViopSpec(BigDecimal.ONE,         new BigDecimal("0.10"), "USD"); // ons altın/gümüş
    private static final ViopSpec METAL_TRY = new ViopSpec(BigDecimal.ONE,         new BigDecimal("0.10"), "TRY"); // gram altın
    private static final ViopSpec EQUITY    = new ViopSpec(new BigDecimal("100"),  new BigDecimal("0.15"), "TRY"); // pay (hisse) vadeli = 100 pay
    private static final ViopSpec DEFAULT   = new ViopSpec(BigDecimal.ONE,         new BigDecimal("0.15"), "TRY"); // fallback: spec yoksa sistem çökmesin

    /** Sözleşmenin görünen adına göre tam spec'i (çarpan+teminat+para birimi) döndürür; tanınmazsa güvenli DEFAULT. */
    public ViopSpec getSpec(String displayName) {
        if (displayName == null || displayName.isBlank()) return DEFAULT;
        String s = displayName.toUpperCase(Locale.forLanguageTag("tr-TR"));

        if (s.contains("BİST 30") || s.contains("BIST 30") || s.contains("XU030")
                || s.contains("BİST 100") || s.contains("BIST 100") || s.contains("XU100")) {
            return INDEX;
        }
        if (s.contains("EURO/DOLAR") || s.contains("EURUSD") || s.contains("STERLİN") || s.contains("GBP")) {
            return FX_USD;
        }
        if (s.contains("DOLAR/TL") || s.contains("USDTRY") || s.contains("EURO/TL") || s.contains("EURTRY")) {
            return FX_TRY;
        }
        if (s.contains("ONS") || s.contains("XAUUSD") || s.contains("XAGUSD") || (s.contains("GÜMÜŞ") && !s.contains("GRAM"))) {
            return METAL_USD;
        }
        if (s.contains("ALTIN") || s.contains("XAU") || s.contains("GÜMÜŞ") || s.contains("XAG") || s.contains("GRAM")) {
            return METAL_TRY;
        }
        // Geri kalan: tek hisse (pay) vadeli sözleşmeleri
        return EQUITY;
    }

    /** Sözleşmenin çarpanını döndürür (geriye uyum — mevcut çağıranlar bozulmasın). */
    public BigDecimal getContractSize(String displayName) {
        return getSpec(displayName).multiplier();
    }
}
