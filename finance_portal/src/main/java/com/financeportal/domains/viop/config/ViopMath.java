package com.financeportal.domains.viop.config;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * VİOP pozisyonu için bağımsız (stateless) finansal formüller — hiçbir bağımlılığı yok, birim testi kolay.
 *
 * Yön: LONG = +1, SHORT = -1. SHORT'ta fiyat DÜŞÜŞÜ kârdır; bunu {@code dirSign} otomatik tersine çevirir,
 * böylece spot mantığı ("fiyat düştü → zarar") tek çarpanla LONG ve SHORT için doğru olur.
 *
 * Temel ilke: VİOP'ta tam fiyat değil TEMİNAT bağlanır. Portföye katkı = teminat + pnl (notional DEĞİL);
 * getiri yüzdesi de bağlanan teminata göre ölçülür (kaldıraçlı gerçek getiri).
 */
public final class ViopMath {

    private ViopMath() {}

    /** LONG için +1, SHORT için -1. null/diğer = LONG (geriye uyumlu varsayılan). */
    public static int dirSign(String direction) {
        return "SHORT".equalsIgnoreCase(direction) ? -1 : 1;
    }

    /** Notional = adet × güncelFiyat × çarpan. Piyasada kontrol edilen tutar (risk göstergesi). */
    public static BigDecimal notional(BigDecimal qty, BigDecimal currentPrice, BigDecimal multiplier) {
        return nz(qty).multiply(nz(currentPrice)).multiply(nz(multiplier));
    }

    /** Bağlanan teminat = adet × girişFiyat × çarpan × teminatOranı. */
    public static BigDecimal marginPosted(BigDecimal qty, BigDecimal entryPrice, BigDecimal multiplier, BigDecimal marginRate) {
        return nz(qty).multiply(nz(entryPrice)).multiply(nz(multiplier)).multiply(nz(marginRate));
    }

    /** Kâr/zarar = adet × (güncelFiyat − girişFiyat) × çarpan × yön. SHORT'ta işaret terslenir. */
    public static BigDecimal pnl(BigDecimal qty, BigDecimal entryPrice, BigDecimal currentPrice, BigDecimal multiplier, int dirSign) {
        BigDecimal diff = nz(currentPrice).subtract(nz(entryPrice));
        return nz(qty).multiply(diff).multiply(nz(multiplier)).multiply(BigDecimal.valueOf(dirSign));
    }

    /** Kaldıraç = notional / teminat. Teminat 0 ise 0 (bölme hatası olmasın). */
    public static BigDecimal leverage(BigDecimal notional, BigDecimal marginPosted) {
        if (marginPosted == null || marginPosted.signum() == 0) return BigDecimal.ZERO;
        return nz(notional).divide(marginPosted, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
