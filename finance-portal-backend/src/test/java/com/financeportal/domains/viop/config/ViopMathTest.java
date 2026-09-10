package com.financeportal.domains.viop.config;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ViopMathTest {

    private static BigDecimal bd(String v) { return new BigDecimal(v); }

    // -------- dirSign --------

    @Test
    void dirSign_nullOrLong_isPositive() {
        assertEquals(1, ViopMath.dirSign(null));
        assertEquals(1, ViopMath.dirSign("LONG"));
        assertEquals(1, ViopMath.dirSign("long"));
        assertEquals(1, ViopMath.dirSign("garip")); // tanınmayan → LONG
    }

    @Test
    void dirSign_short_isNegative() {
        assertEquals(-1, ViopMath.dirSign("SHORT"));
        assertEquals(-1, ViopMath.dirSign("short"));
    }

    // -------- notional / margin / leverage --------

    @Test
    void notional_qtyTimesPriceTimesMultiplier() {
        // 2 sözleşme × 100 fiyat × 100 çarpan = 20.000
        assertEquals(0, bd("20000").compareTo(ViopMath.notional(bd("2"), bd("100"), bd("100"))));
    }

    @Test
    void marginPosted_appliesMarginRate() {
        // 2 × 100 × 100 × 0.10 = 2.000 (notional'ın %10'u)
        assertEquals(0, bd("2000.00").compareTo(ViopMath.marginPosted(bd("2"), bd("100"), bd("100"), bd("0.10"))));
    }

    @Test
    void leverage_notionalOverMargin() {
        // 20.000 / 2.000 = 10x
        assertEquals(0, bd("10.00").compareTo(ViopMath.leverage(bd("20000"), bd("2000"))));
    }

    @Test
    void leverage_zeroMargin_returnsZero() {
        assertEquals(0, BigDecimal.ZERO.compareTo(ViopMath.leverage(bd("20000"), BigDecimal.ZERO)));
    }

    // -------- pnl: LONG --------

    @Test
    void pnl_long_priceUp_profit() {
        // LONG, fiyat 100→110: 2 × 10 × 100 × (+1) = +2.000
        BigDecimal pnl = ViopMath.pnl(bd("2"), bd("100"), bd("110"), bd("100"), ViopMath.dirSign("LONG"));
        assertEquals(0, bd("2000").compareTo(pnl));
    }

    @Test
    void pnl_long_priceDown_loss() {
        // LONG, fiyat 100→90: 2 × (-10) × 100 × (+1) = -2.000
        BigDecimal pnl = ViopMath.pnl(bd("2"), bd("100"), bd("90"), bd("100"), ViopMath.dirSign("LONG"));
        assertTrue(pnl.signum() < 0);
        assertEquals(0, bd("-2000").compareTo(pnl));
    }

    // -------- pnl: SHORT (işaret terslenir) --------

    @Test
    void pnl_short_priceDown_profit() {
        // SHORT, fiyat 100→90 (düşüş): 2 × (-10) × 100 × (-1) = +2.000  ← short DÜŞÜŞTE kazanır
        BigDecimal pnl = ViopMath.pnl(bd("2"), bd("100"), bd("90"), bd("100"), ViopMath.dirSign("SHORT"));
        assertEquals(0, bd("2000").compareTo(pnl));
    }

    @Test
    void pnl_short_priceUp_loss() {
        // SHORT, fiyat 100→110 (yükseliş): 2 × 10 × 100 × (-1) = -2.000  ← short YÜKSELİŞTE kaybeder
        BigDecimal pnl = ViopMath.pnl(bd("2"), bd("100"), bd("110"), bd("100"), ViopMath.dirSign("SHORT"));
        assertEquals(0, bd("-2000").compareTo(pnl));
    }
}
