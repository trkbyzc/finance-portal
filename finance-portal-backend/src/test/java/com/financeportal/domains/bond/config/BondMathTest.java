package com.financeportal.domains.bond.config;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BondMathTest {

    // -------- cleanPriceFromYield --------

    @Test
    void cleanPrice_yieldEqualsCoupon_isPar() {
        // Kupon = getiri ise tahvil PAR (100) fiyatlanır
        assertEquals(100.0, BondMath.cleanPriceFromYield(10, 10, 5), 0.01);
    }

    @Test
    void cleanPrice_zeroCoupon_isDiscounted() {
        // Sıfır-kupon (bono): 100 / 1.10^5 = 62.09
        assertEquals(62.09, BondMath.cleanPriceFromYield(10, 0, 5), 0.05);
    }

    @Test
    void cleanPrice_inverseRelationship_higherYieldLowerPrice() {
        double pLow = BondMath.cleanPriceFromYield(10, 0, 5);
        double pHigh = BondMath.cleanPriceFromYield(15, 0, 5);
        assertTrue(pHigh < pLow, "getiri ↑ → fiyat ↓ olmalı");
    }

    @Test
    void cleanPrice_couponAboveYield_isPremium() {
        // Kupon > getiri → primli (>100)
        assertTrue(BondMath.cleanPriceFromYield(8, 12, 5) > 100.0);
    }

    @Test
    void cleanPrice_zeroOrNegativeYears_isPar() {
        assertEquals(100.0, BondMath.cleanPriceFromYield(10, 5, 0), 0.0001);
    }

    // -------- yieldFromCleanPrice (ters çevirme) --------

    @Test
    void yieldFromPrice_zeroCoupon_roundTrip() {
        double price = BondMath.cleanPriceFromYield(10, 0, 5); // 62.09
        assertEquals(10.0, BondMath.yieldFromCleanPrice(price, 0, 5), 0.05);
    }

    @Test
    void yieldFromPrice_par_equalsCoupon() {
        // Fiyat 100 (par) → getiri = kupon
        assertEquals(10.0, BondMath.yieldFromCleanPrice(100.0, 10, 5), 0.05);
    }

    // -------- accruedInterest --------

    @Test
    void accrued_onCouponDate_isZero() {
        // 2026-01-01 tam kupon tarihi (yarı yıllık, vade 2030-01-01) → işlemiş faiz 0
        double acc = BondMath.accruedInterest(6, LocalDate.of(2030, 1, 1), LocalDate.of(2026, 1, 1), 2);
        assertEquals(0.0, acc, 0.01);
    }

    @Test
    void accrued_midPeriod_isPartialCoupon() {
        // 2026-01-01 → 2026-04-01 (90/181 gün), dönem kuponu = 6/2 = 3 → ~1.49
        double acc = BondMath.accruedInterest(6, LocalDate.of(2030, 1, 1), LocalDate.of(2026, 4, 1), 2);
        assertEquals(1.49, acc, 0.1);
        assertTrue(acc > 0 && acc < 3.0);
    }

    @Test
    void accrued_zeroCoupon_isZero() {
        assertEquals(0.0, BondMath.accruedInterest(0, LocalDate.of(2030, 1, 1), LocalDate.of(2026, 4, 1), 2), 0.0001);
    }

    @Test
    void accrued_afterMaturity_isZero() {
        assertEquals(0.0, BondMath.accruedInterest(6, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 1), 2), 0.0001);
    }

    // -------- dirtyPrice / yearsBetween --------

    @Test
    void dirtyPrice_cleanPlusAccrued() {
        assertEquals(96.5, BondMath.dirtyPrice(95.0, 1.5), 0.0001);
    }

    @Test
    void yearsBetween_actThreeSixtyFive() {
        assertEquals(1.0, BondMath.yearsBetween(LocalDate.of(2026, 1, 1), LocalDate.of(2027, 1, 1)), 0.01);
        assertEquals(0.0, BondMath.yearsBetween(LocalDate.of(2027, 1, 1), LocalDate.of(2026, 1, 1)), 0.0001);
    }
}
