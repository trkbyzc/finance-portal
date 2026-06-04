import { describe, it, expect } from 'vitest';
import { detectNativeCurrency, nativeCurrencyForType, isYieldAsset } from './currencyConversion';

describe('detectNativeCurrency', () => {
    it('null/undefined asset → USD default', () => {
        expect(detectNativeCurrency(null)).toBe('USD');
        expect(detectNativeCurrency(undefined)).toBe('USD');
    });

    it('.IS suffix → TRY', () => {
        expect(detectNativeCurrency({ symbol: 'THYAO.IS' })).toBe('TRY');
    });

    it('TR_BOND kategorisi → TRY', () => {
        expect(detectNativeCurrency({ assetCategory: 'TR_BOND', symbol: 'X' })).toBe('TRY');
    });

    it('TR_FUND kategorisi → TRY', () => {
        expect(detectNativeCurrency({ assetCategory: 'TR_FUND', symbol: 'AFA' })).toBe('TRY');
    });

    it('ALTIN içeren sembol → TRY', () => {
        expect(detectNativeCurrency({ symbol: 'GRAM_ALTIN' })).toBe('TRY');
        expect(detectNativeCurrency({ symbol: 'BILEZIK' })).toBe('TRY');
    });

    it('VIOP kategori → TRY', () => {
        expect(detectNativeCurrency({ assetCategory: 'VIOP', symbol: 'F_XU100' })).toBe('TRY');
    });

    it('INDEX + BIST X.. → TRY', () => {
        expect(detectNativeCurrency({ assetCategory: 'INDEX', symbol: 'XU100' })).toBe('TRY');
        expect(detectNativeCurrency({ assetCategory: 'INDEX', symbol: 'XU030.IS' })).toBe('TRY');
    });

    it("USDTRY=X → TRY (quote)", () => {
        expect(detectNativeCurrency({ symbol: 'USDTRY=X' })).toBe('TRY');
    });

    it("EURUSD=X → USD (quote)", () => {
        expect(detectNativeCurrency({ symbol: 'EURUSD=X' })).toBe('USD');
    });

    it("currencyCode TRY → TRY", () => {
        expect(detectNativeCurrency({ currencyCode: 'TRY', symbol: 'X' })).toBe('TRY');
    });

    it('default → USD (kripto, ABD hissesi, vs.)', () => {
        expect(detectNativeCurrency({ symbol: 'AAPL' })).toBe('USD');
        expect(detectNativeCurrency({ symbol: 'BTC' })).toBe('USD');
    });

    it('yahooSymbol fallback', () => {
        expect(detectNativeCurrency({ yahooSymbol: 'THYAO.IS' })).toBe('TRY');
    });
});

describe('nativeCurrencyForType', () => {
    it('STOCK + .IS → TRY', () => {
        expect(nativeCurrencyForType('STOCK', 'THYAO.IS')).toBe('TRY');
    });
    it('STOCK + bare → USD (yabancı hisse)', () => {
        expect(nativeCurrencyForType('STOCK', 'AAPL')).toBe('USD');
    });
    it('CRYPTO → USD', () => {
        expect(nativeCurrencyForType('CRYPTO', 'BTC')).toBe('USD');
    });
    it('COMMODITY → USD', () => {
        expect(nativeCurrencyForType('COMMODITY', 'GC=F')).toBe('USD');
    });
    it('BOND → USD (US Treasury)', () => {
        expect(nativeCurrencyForType('BOND', '^TNX')).toBe('USD');
    });
    it.each(['CURRENCY', 'GOLD', 'BOND_TR', 'FUND', 'TR_BOND', 'TR_FUND'])(
        '%s → TRY default', (type) => {
            expect(nativeCurrencyForType(type, 'X')).toBe('TRY');
        }
    );
    it('lowercase typeKey', () => {
        expect(nativeCurrencyForType('stock', 'AAPL')).toBe('USD');
    });
    it('null typeKey → default switch (TRY)', () => {
        expect(nativeCurrencyForType(null, null)).toBe('TRY');
    });
});

describe('isYieldAsset', () => {
    it('null → false', () => expect(isYieldAsset(null)).toBe(false));
    it('TR_BOND kategori → true', () => {
        expect(isYieldAsset({ assetCategory: 'TR_BOND', symbol: 'X' })).toBe(true);
    });
    it('TP. prefix sembol → true (TR tahvil)', () => {
        expect(isYieldAsset({ symbol: 'TP.TRY10Y' })).toBe(true);
    });
    it('BOND + ^ prefix → true (US Treasury yield)', () => {
        expect(isYieldAsset({ assetCategory: 'BOND', symbol: '^TNX' })).toBe(true);
    });
    it('regular STOCK → false', () => {
        expect(isYieldAsset({ assetCategory: 'STOCK', symbol: 'AAPL' })).toBe(false);
    });
    it('BOND non-yield (global eurobond) → false', () => {
        expect(isYieldAsset({ assetCategory: 'BOND', symbol: 'XYZ' })).toBe(false);
    });
});
