package com.financeportal.domains.viop.config;

import java.time.LocalDate;
import java.time.YearMonth;

/**
 * VİOP sözleşme sembolünden vade (expiry) tarihini çıkarır.
 *
 * <p>Sembol formatı {@code F_[DAYANAK][AAYY]} — örn. {@code F_XU0300625} → 06/2025,
 * {@code F_GARAN0625} → 06/2025. Son 4 hane = AAYY (ay + 2 haneli yıl).
 *
 * <p>Vade = o ayın son takvim günü. BİST gerçek uzlaşması ayın son iş günüdür; son takvim günü
 * kullanmak biraz tutucudur (pozisyonu asla erken kapatmaz, en fazla 1-2 gün geç kapatır).
 */
public final class ViopExpiry {

    private ViopExpiry() {}

    /** Sembolün vade tarihini döndürür; AAYY eki çözülemezse null (auto-close yapılmaz → güvenli). */
    public static LocalDate expiryDate(String symbol) {
        if (symbol == null || symbol.length() < 4) return null;
        String last4 = symbol.substring(symbol.length() - 4);
        for (int i = 0; i < 4; i++) {
            if (!Character.isDigit(last4.charAt(i))) return null;
        }
        int mm = Integer.parseInt(last4.substring(0, 2));
        int yy = Integer.parseInt(last4.substring(2));
        if (mm < 1 || mm > 12) return null;
        return YearMonth.of(2000 + yy, mm).atEndOfMonth();
    }

    /** Bugün vade tarihinden SONRAYSA pozisyonun vadesi dolmuştur. */
    public static boolean isExpired(String symbol, LocalDate today) {
        LocalDate expiry = expiryDate(symbol);
        return expiry != null && today.isAfter(expiry);
    }
}
