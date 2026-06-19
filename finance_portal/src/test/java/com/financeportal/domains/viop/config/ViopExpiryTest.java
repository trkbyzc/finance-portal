package com.financeportal.domains.viop.config;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ViopExpiryTest {

    @Test
    void expiryDate_parsesMMYYSuffix_endOfMonth() {
        assertEquals(LocalDate.of(2025, 6, 30), ViopExpiry.expiryDate("F_XU0300625")); // 06/25
        assertEquals(LocalDate.of(2025, 6, 30), ViopExpiry.expiryDate("F_GARAN0625"));
        assertEquals(LocalDate.of(2026, 2, 28), ViopExpiry.expiryDate("F_USDTRY0226")); // 02/26 → 28 gün
    }

    @Test
    void expiryDate_invalidOrMissing_returnsNull() {
        assertNull(ViopExpiry.expiryDate(null));
        assertNull(ViopExpiry.expiryDate("BTC"));        // < 4 karakter
        assertNull(ViopExpiry.expiryDate("THYAO"));      // son 4 hane değil
        assertNull(ViopExpiry.expiryDate("F_XU0301325")); // ay = 13 → geçersiz
    }

    @Test
    void isExpired_pastContract_true() {
        // 06/2025 sözleşmesi, bugün 2026-06-19 → vadesi geçti
        assertTrue(ViopExpiry.isExpired("F_XU0300625", LocalDate.of(2026, 6, 19)));
    }

    @Test
    void isExpired_futureContract_false() {
        // 06/2026 sözleşmesi (30 Haziran), bugün 2026-06-19 → henüz vade gelmedi
        assertFalse(ViopExpiry.isExpired("F_XU0300626", LocalDate.of(2026, 6, 19)));
    }

    @Test
    void isExpired_unparseable_false() {
        assertFalse(ViopExpiry.isExpired("THYAO", LocalDate.of(2026, 6, 19)));
    }
}
