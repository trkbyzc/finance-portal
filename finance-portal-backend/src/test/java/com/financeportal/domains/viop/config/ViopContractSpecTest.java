package com.financeportal.domains.viop.config;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class ViopContractSpecTest {

    private final ViopContractSpec spec = new ViopContractSpec();

    @Test
    void getContractSize_null_returnsOne() {
        assertEquals(0, BigDecimal.ONE.compareTo(spec.getContractSize(null)));
    }

    @Test
    void getContractSize_empty_returnsOne() {
        assertEquals(0, BigDecimal.ONE.compareTo(spec.getContractSize("")));
        assertEquals(0, BigDecimal.ONE.compareTo(spec.getContractSize("   ")));
    }

    @Test
    void getContractSize_indexBist30_returns100() {
        assertEquals(0, new BigDecimal("100").compareTo(spec.getContractSize("BİST 30 Endeks")));
        assertEquals(0, new BigDecimal("100").compareTo(spec.getContractSize("BIST 30")));
        assertEquals(0, new BigDecimal("100").compareTo(spec.getContractSize("XU030 Vadeli")));
    }

    @Test
    void getContractSize_indexBist100_returns100() {
        assertEquals(0, new BigDecimal("100").compareTo(spec.getContractSize("BİST 100 Endeks")));
        assertEquals(0, new BigDecimal("100").compareTo(spec.getContractSize("BIST 100")));
        assertEquals(0, new BigDecimal("100").compareTo(spec.getContractSize("XU100")));
    }

    @Test
    void getContractSize_usdtry_returns1000() {
        assertEquals(0, new BigDecimal("1000").compareTo(spec.getContractSize("Dolar/TL")));
        assertEquals(0, new BigDecimal("1000").compareTo(spec.getContractSize("USDTRY")));
    }

    @Test
    void getContractSize_eurtry_returns1000() {
        assertEquals(0, new BigDecimal("1000").compareTo(spec.getContractSize("Euro/TL")));
        assertEquals(0, new BigDecimal("1000").compareTo(spec.getContractSize("EURTRY")));
    }

    @Test
    void getContractSize_eurusd_returns1000() {
        assertEquals(0, new BigDecimal("1000").compareTo(spec.getContractSize("Euro/Dolar")));
        assertEquals(0, new BigDecimal("1000").compareTo(spec.getContractSize("EURUSD")));
    }

    @Test
    void getContractSize_sterlin_returns1000() {
        assertEquals(0, new BigDecimal("1000").compareTo(spec.getContractSize("Sterlin/TL")));
        assertEquals(0, new BigDecimal("1000").compareTo(spec.getContractSize("GBP/TL")));
    }

    @Test
    void getContractSize_gold_returnsOne() {
        assertEquals(0, BigDecimal.ONE.compareTo(spec.getContractSize("Altın")));
        assertEquals(0, BigDecimal.ONE.compareTo(spec.getContractSize("XAU/TL")));
    }

    @Test
    void getContractSize_silver_returnsOne() {
        assertEquals(0, BigDecimal.ONE.compareTo(spec.getContractSize("Gümüş")));
        assertEquals(0, BigDecimal.ONE.compareTo(spec.getContractSize("XAG/TL")));
    }

    @Test
    void getContractSize_singleStockFuture_returns100() {
        // Pay vadeli (hisse vadeli) - default equity size
        assertEquals(0, new BigDecimal("100").compareTo(spec.getContractSize("AKBNK Vadeli")));
        assertEquals(0, new BigDecimal("100").compareTo(spec.getContractSize("THYAO Pay Vadeli")));
        assertEquals(0, new BigDecimal("100").compareTo(spec.getContractSize("GARAN")));
    }

    @Test
    void getContractSize_caseInsensitive() {
        assertEquals(0, new BigDecimal("100").compareTo(spec.getContractSize("bist 30")));
        assertEquals(0, new BigDecimal("1000").compareTo(spec.getContractSize("usdtry")));
    }
}
