package com.financeportal.service.chat.tools;

import com.financeportal.model.enums.AssetType;
import com.financeportal.service.portfolio.PortfolioPriceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GetAssetPriceToolTest {

    private PortfolioPriceService priceService;
    private GetAssetPriceTool tool;

    @BeforeEach
    void setUp() {
        priceService = mock(PortfolioPriceService.class);
        tool = new GetAssetPriceTool(priceService);
    }

    @Test
    void gecerli_symbol_assetType_price_doner() {
        when(priceService.getCurrentPrice("BTC", AssetType.CRYPTO)).thenReturn(new BigDecimal("65000"));
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.execute(Map.of(
                "symbol", "btc", "assetType", "crypto"
        ));
        assertEquals("BTC", out.get("symbol"));
        assertEquals("CRYPTO", out.get("assetType"));
        assertEquals(new BigDecimal("65000"), out.get("price"));
    }

    @Test
    void eksik_symbol_error() {
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.execute(Map.of("assetType", "STOCK"));
        assertNotNull(out.get("error"));
    }

    @Test
    void gecersiz_assetType_error() {
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.execute(Map.of(
                "symbol", "XYZ", "assetType", "FOO_BAR"
        ));
        assertNotNull(out.get("error"));
    }

    @Test
    void fiyat_null_donerse_error() {
        when(priceService.getCurrentPrice("XYZ", AssetType.STOCK)).thenReturn(null);
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.execute(Map.of(
                "symbol", "XYZ", "assetType", "STOCK"
        ));
        assertNotNull(out.get("error"));
    }

    @Test
    void servis_exception_atarsa_error() {
        when(priceService.getCurrentPrice("XYZ", AssetType.STOCK)).thenThrow(new RuntimeException("down"));
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.execute(Map.of(
                "symbol", "XYZ", "assetType", "STOCK"
        ));
        assertTrue(out.get("error").toString().contains("down"));
    }

    @Test
    void schema_required_symbol_ve_assetType_iceriyor() {
        Map<String, Object> schema = tool.parametersJsonSchema();
        @SuppressWarnings("unchecked")
        var required = (java.util.List<String>) schema.get("required");
        assertTrue(required.contains("symbol"));
        assertTrue(required.contains("assetType"));
    }
}
