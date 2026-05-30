package com.financeportal.util;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BistConstantsTest {

    @Test
    void bist30_isNotEmpty() {
        assertFalse(BistConstants.BIST_30.isEmpty());
    }

    @Test
    void bist30_containsCoreBlueChips() {
        assertTrue(BistConstants.BIST_30.contains("AKBNK"));
        assertTrue(BistConstants.BIST_30.contains("GARAN"));
        assertTrue(BistConstants.BIST_30.contains("THYAO"));
        assertTrue(BistConstants.BIST_30.contains("ISCTR"));
    }

    @Test
    void bist50Supplement_doesNotOverlapBist30() {
        Set<String> overlap = new HashSet<>(BistConstants.BIST_30);
        overlap.retainAll(BistConstants.BIST_50_EK_HISSELER);
        assertTrue(overlap.isEmpty(), "BIST_50_EK_HISSELER should NOT contain any BIST_30 symbols, found: " + overlap);
    }

    @Test
    void bist100Supplement_doesNotOverlapBist30Or50() {
        Set<String> overlap = new HashSet<>(BistConstants.BIST_100_EK_HISSELER);
        overlap.retainAll(BistConstants.BIST_30);
        assertTrue(overlap.isEmpty(), "BIST_100_EK should NOT contain BIST_30, found: " + overlap);

        overlap = new HashSet<>(BistConstants.BIST_100_EK_HISSELER);
        overlap.retainAll(BistConstants.BIST_50_EK_HISSELER);
        assertTrue(overlap.isEmpty(), "BIST_100_EK should NOT contain BIST_50_EK, found: " + overlap);
    }

    @Test
    void totalUniverse_matches100_whenAllTiersAdded() {
        Set<String> all = new HashSet<>();
        all.addAll(BistConstants.BIST_30);
        all.addAll(BistConstants.BIST_50_EK_HISSELER);
        all.addAll(BistConstants.BIST_100_EK_HISSELER);
        // 33 (BIST 30 listede 33 var) + 25 (50 ek) + 50 (100 ek) = 108 (üst sınır), 100 = alt sınır
        assertTrue(all.size() >= 100, "Toplam evren en az BIST 100 büyüklüğünde olmalı, oldu: " + all.size());
    }

    @Test
    void allSymbols_areUpperCaseAlphanumeric() {
        Set<String> all = new HashSet<>();
        all.addAll(BistConstants.BIST_30);
        all.addAll(BistConstants.BIST_50_EK_HISSELER);
        all.addAll(BistConstants.BIST_100_EK_HISSELER);

        for (String symbol : all) {
            assertEquals(symbol.toUpperCase(), symbol, "Symbol '" + symbol + "' should be uppercase");
            assertTrue(symbol.matches("^[A-Z0-9]+$"),
                    "Symbol '" + symbol + "' should be alphanumeric uppercase");
        }
    }
}
