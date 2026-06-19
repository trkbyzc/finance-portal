package com.financeportal.domains.bond.config;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Sabit getirili (tahvil/bono/eurobond) için bağımsız (stateless) finansal formüller.
 *
 * <p>Temel ilke: tahvil hisse gibi adet×fiyat değil — bir <b>nominal (face)</b> tutarı,
 * <b>temiz fiyat</b> (face'in %'si, 100 baz) üzerinden alınır. Getiri ↑ → fiyat ↓ (ters ilişki).
 * Ödenen tutar = <b>kirli fiyat = temiz fiyat + işlemiş faiz</b>. Toplam getiri = fiyat değişimi
 * (kapital K/Z) + kupon geliri.
 *
 * <p>Hesaplar analitiktir (indicative değerleme) — pow/log gerektirdiği için {@code double} kullanır;
 * çağıran sonucu BigDecimal'e çevirir. Yıllık bileşik getiri varsayımı.
 */
public final class BondMath {

    private BondMath() {}

    /** İki tarih arası yıl kesri (ACT/365). Negatifse 0. */
    public static double yearsBetween(LocalDate from, LocalDate to) {
        if (from == null || to == null) return 0.0;
        double days = ChronoUnit.DAYS.between(from, to);
        return days <= 0 ? 0.0 : days / 365.0;
    }

    /**
     * Temiz fiyat (face = 100 baz) — getiriden.
     * <ul>
     *   <li>{@code couponPct = 0} → iskontolu/sıfır-kupon (bono): {@code 100 / (1+y)^t}.</li>
     *   <li>{@code couponPct > 0} → kuponlu: yıllık kuponların + nominalin bugünkü değeri.</li>
     * </ul>
     * Getiri = coupon iken fiyat ≈ 100 (par).
     */
    public static double cleanPriceFromYield(double yieldPct, double couponPct, double years) {
        if (years <= 0) return 100.0;
        double y = yieldPct / 100.0;
        if (Math.abs(y) < 1e-9) return 100.0 + couponPct * years; // y≈0 koruması
        if (couponPct <= 0) return 100.0 / Math.pow(1 + y, years); // sıfır-kupon / iskontolu

        int n = Math.max(1, (int) Math.round(years)); // tam yıllık kupon sayısı (yaklaşık)
        double pv = 0.0;
        for (int k = 1; k <= n; k++) pv += couponPct / Math.pow(1 + y, k);
        pv += 100.0 / Math.pow(1 + y, n);
        return pv;
    }

    /** Temiz fiyattan getiri (%) — bisection ile ters çevirme (fiyat ↓ ⇒ getiri ↑). */
    public static double yieldFromCleanPrice(double cleanPrice, double couponPct, double years) {
        if (years <= 0 || cleanPrice <= 0) return 0.0;
        double lo = -0.50, hi = 5.0; // -%50 .. +%500 getiri aralığı
        for (int i = 0; i < 200; i++) {
            double mid = (lo + hi) / 2.0;
            double p = cleanPriceFromYield(mid * 100.0, couponPct, years);
            if (p > cleanPrice) lo = mid; else hi = mid;
            if (hi - lo < 1e-8) break;
        }
        return ((lo + hi) / 2.0) * 100.0;
    }

    /**
     * İşlemiş faiz (face = 100 baz): son kupondan bu yana biriken kupon.
     * {@code freq} = yıllık kupon sayısı (örn. 2 = altı aylık). Kupon tarihleri vadeden geriye sayılır.
     */
    public static double accruedInterest(double couponPct, LocalDate maturity, LocalDate asOf, int freq) {
        if (couponPct <= 0 || freq <= 0 || maturity == null || asOf == null) return 0.0;
        if (!asOf.isBefore(maturity)) return 0.0; // vade gelmiş/geçmiş → işlemiş faiz yok

        int monthsPerPeriod = Math.max(1, 12 / freq);
        LocalDate periodEnd = maturity;
        while (periodEnd.isAfter(asOf)) periodEnd = periodEnd.minusMonths(monthsPerPeriod);
        LocalDate lastCoupon = periodEnd;                 // asOf'tan önceki en yakın kupon
        LocalDate nextCoupon = lastCoupon.plusMonths(monthsPerPeriod);

        double periodDays = ChronoUnit.DAYS.between(lastCoupon, nextCoupon);
        double accruedDays = ChronoUnit.DAYS.between(lastCoupon, asOf);
        if (periodDays <= 0) return 0.0;

        double periodCoupon = couponPct / freq;           // bir dönemin kuponu (face=100)
        return periodCoupon * (accruedDays / periodDays);
    }

    /** Kirli fiyat = temiz fiyat + işlemiş faiz. */
    public static double dirtyPrice(double cleanPrice, double accrued) {
        return cleanPrice + accrued;
    }
}
