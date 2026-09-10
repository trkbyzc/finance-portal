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
        Map<String, Object> out = (Map<String, Object>) tool.assetPrice("btc", "crypto"
        );
        assertEquals("BTC", out.get("symbol"));
        assertEquals("CRYPTO", out.get("assetType"));
        assertEquals(new BigDecimal("65000"), out.get("price"));
        assertEquals("USD", out.get("currency"));   // crypto → USD (CoinGecko)
    }

    @Test
    void BIST_hissesi_bare_sembolde_bulamayinca_IS_suffix_ile_tekrar_dener() {
        // İlk arama 0, .IS'li arama 39.20 — beklenen: tool ikinci sonucu dönsün
        when(priceService.getCurrentPrice("THYAO", AssetType.STOCK)).thenReturn(BigDecimal.ZERO);
        when(priceService.getCurrentPrice("THYAO.IS", AssetType.STOCK)).thenReturn(new BigDecimal("39.20"));

        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.assetPrice("THYAO", "STOCK"
        );
        assertEquals(new BigDecimal("39.20"), out.get("price"));
        assertEquals("THYAO.IS", out.get("resolvedSymbol"));
        assertEquals("TRY", out.get("currency"));   // BIST → TRY
    }

    @Test
    void crypto_currency_USD_olarak_etiketlenir() {
        when(priceService.getCurrentPrice("ETH", AssetType.CRYPTO)).thenReturn(new BigDecimal("3500"));
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.assetPrice("ETH", "CRYPTO"
        );
        assertEquals("USD", out.get("currency"));
    }

    @Test
    void doviz_currency_TRY_olarak_etiketlenir() {
        when(priceService.getCurrentPrice("EUR", AssetType.CURRENCY)).thenReturn(new BigDecimal("53.37"));
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.assetPrice("EUR", "CURRENCY"
        );
        assertEquals("TRY", out.get("currency"));
    }

    @Test
    void eksik_symbol_error() {
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.assetPrice(null, "STOCK");
        assertNotNull(out.get("error"));
    }

    @Test
    void gecersiz_assetType_error() {
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.assetPrice("XYZ", "FOO_BAR"
        );
        assertNotNull(out.get("error"));
    }

    @Test
    void fiyat_null_donerse_error() {
        when(priceService.getCurrentPrice("XYZ", AssetType.STOCK)).thenReturn(null);
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.assetPrice("XYZ", "STOCK"
        );
        assertNotNull(out.get("error"));
    }

    @Test
    void servis_tum_variantlar_icin_exception_atarsa_error_doner() {
        // Her iki variant (XYZ ve XYZ.IS) da patlasın — tool error dönmeli, exception yutmamalı
        when(priceService.getCurrentPrice("XYZ", AssetType.STOCK)).thenThrow(new RuntimeException("down"));
        when(priceService.getCurrentPrice("XYZ.IS", AssetType.STOCK)).thenThrow(new RuntimeException("down"));
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.assetPrice("XYZ", "STOCK"
        );
        assertTrue(out.get("error").toString().toLowerCase().contains("bulunamad"));
    }

    /**
     * JSON Schema artik elle yazilmiyor; Spring AI onu @ToolParam anotasyonlarindan
     * uretiyor. Olculmesi gereken sey semanin sekli degil, gecersiz argumanin hala
     * anlasilir bir hata donmesi.
     */
    @Test
    void eksik_assetType_error() {
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) tool.assetPrice("THYAO", null);
        assertNotNull(out.get("error"));
    }
}
