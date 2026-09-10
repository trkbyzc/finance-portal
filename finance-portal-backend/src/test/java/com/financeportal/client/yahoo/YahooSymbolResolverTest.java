package com.financeportal.client.yahoo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class YahooSymbolResolverTest {

    private final YahooSymbolResolver resolver = new YahooSymbolResolver();

    @Test
    void resolve_null_returnsNull() {
        assertNull(resolver.resolve(null));
    }

    @Test
    void resolve_knownGlobalEtfs_returnedAsIs() {
        assertEquals("SPY", resolver.resolve("SPY"));
        assertEquals("GLD", resolver.resolve("GLD"));
        assertEquals("TLT", resolver.resolve("TLT"));
        assertEquals("BND", resolver.resolve("BND"));
        // Lowercase normalize edilir
        assertEquals("SPY", resolver.resolve("spy"));
    }

    @Test
    void resolve_alreadyHasUsdSuffix_passthrough() {
        assertEquals("BTC-USD", resolver.resolve("BTC-USD"));
        assertEquals("ETH-USD", resolver.resolve("eth-USD"));
    }

    @Test
    void resolve_alreadyHasEqualsX_passthrough() {
        assertEquals("USDTRY=X", resolver.resolve("USDTRY=X"));
        assertEquals("USDTRY=X", resolver.resolve("usdtry=X"));
    }

    @Test
    void resolve_bistSymbolWithIs_passthrough() {
        assertEquals("AKBNK.IS", resolver.resolve("AKBNK.IS"));
        assertEquals("THYAO.IS", resolver.resolve("thyao.IS"));
    }

    @Test
    void resolve_futureSymbolWithEqualsF_passthrough() {
        assertEquals("GC=F", resolver.resolve("GC=F"));
        assertEquals("ES=F", resolver.resolve("es=F"));
    }

    @Test
    void resolve_fiatCurrencies_appendsTRYEqualsX() {
        assertEquals("USDTRY=X", resolver.resolve("USD"));
        assertEquals("EURTRY=X", resolver.resolve("EUR"));
        assertEquals("GBPTRY=X", resolver.resolve("GBP"));
        assertEquals("JPYTRY=X", resolver.resolve("jpy"));
        assertEquals("SARTRY=X", resolver.resolve("SAR"));
    }

    @Test
    void resolve_bistIndices_mapToSpecificSymbol() {
        assertEquals("XU100.IS", resolver.resolve("XU100"));
        assertEquals("XU100.IS", resolver.resolve("BIST100"));
        assertEquals("XU030.IS", resolver.resolve("XU030"));
        assertEquals("XU030.IS", resolver.resolve("BIST30"));
        assertEquals("XU050.IS", resolver.resolve("XU050"));
        assertEquals("XU050.IS", resolver.resolve("BIST50"));
        assertEquals("XBANK.IS", resolver.resolve("XBANK"));
        assertEquals("XBANK.IS", resolver.resolve("BISTBANKA"));
        assertEquals("XUSIN.IS", resolver.resolve("XUSIN"));
        assertEquals("XUSIN.IS", resolver.resolve("BISTSINAI"));
    }

    @Test
    void resolve_3to5LetterUnknownSymbol_treatedAsCrypto() {
        assertEquals("BTC-USD", resolver.resolve("BTC"));
        assertEquals("ETH-USD", resolver.resolve("ETH"));
        assertEquals("DOGE-USD", resolver.resolve("DOGE"));
        assertEquals("SHIB-USD", resolver.resolve("shib"));
    }

    @Test
    void resolve_longUnknownSymbol_returnedAsUppercase() {
        // 6+ harf, kripto değil, başka mapping yok → uppercase olarak döner
        assertEquals("BITCOIN", resolver.resolve("BITCOIN"));
        assertEquals("VERYLONGSYMBOL", resolver.resolve("verylongsymbol"));
    }

    @Test
    void resolve_2LetterSymbol_returnedAsIs() {
        // 2 harfli kripto sayılmaz (3-5 arası), passthrough
        assertEquals("AB", resolver.resolve("AB"));
        assertEquals("AB", resolver.resolve("ab"));
    }

    @Test
    void resolve_emptyString_handled() {
        assertEquals("", resolver.resolve(""));
    }
}
