package com.financeportal.domains.crypto.service;

import com.financeportal.domains.crypto.dto.CryptoDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class CryptoIdRegistryTest {

    private CryptoIdRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new CryptoIdRegistry();
    }

    private CryptoDto coin(String code, String geckoId) {
        CryptoDto dto = new CryptoDto();
        dto.setCurrencyCode(code);
        dto.setGeckoId(geckoId);
        return dto;
    }

    @Test
    void resolve_unknownSymbol_returnsNull() {
        assertNull(registry.resolve("PEPE"));
    }

    @Test
    void resolve_nullSymbol_returnsNull() {
        assertNull(registry.resolve(null));
    }

    @Test
    void update_thenResolve_returnsGeckoId() {
        registry.update(List.of(coin("PEPE", "pepe")));
        assertEquals("pepe", registry.resolve("PEPE"));
    }

    @Test
    void resolve_normalizesSuffixes_andCase() {
        registry.update(List.of(coin("PEPE", "pepe")));
        // "-USD", "USDT", "/" ekleri ve küçük harf normalize edilir
        assertEquals("pepe", registry.resolve("PEPE-USD"));
        assertEquals("pepe", registry.resolve("pepeusdt"));
        assertEquals("pepe", registry.resolve("PEPE/USD"));
    }

    @Test
    void update_skipsCoinsWithoutGeckoId() {
        registry.update(List.of(
                coin("BTC", null),
                coin("ETH", "  "),
                coin("SOL", "solana")
        ));
        assertNull(registry.resolve("BTC"));
        assertNull(registry.resolve("ETH"));
        assertEquals("solana", registry.resolve("SOL"));
    }

    @Test
    void update_nullList_isNoOp() {
        registry.update(null);
        assertNull(registry.resolve("BTC"));
    }

    @Test
    void update_overwritesPreviousMapping() {
        registry.update(List.of(coin("X", "old-id")));
        registry.update(List.of(coin("X", "new-id")));
        assertEquals("new-id", registry.resolve("X"));
    }
}
