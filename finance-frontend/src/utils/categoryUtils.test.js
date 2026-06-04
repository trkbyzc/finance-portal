import { describe, it, expect } from 'vitest';
import { detectCategoryFromSymbol, marketsKeyForCategory } from './categoryUtils';

describe('detectCategoryFromSymbol', () => {
    it('null/undefined/non-string → null', () => {
        expect(detectCategoryFromSymbol(null)).toBeNull();
        expect(detectCategoryFromSymbol(undefined)).toBeNull();
        expect(detectCategoryFromSymbol(123)).toBeNull();
        expect(detectCategoryFromSymbol('')).toBeNull();
        expect(detectCategoryFromSymbol('   ')).toBeNull();
    });

    it('"TP." prefix → TR_BOND', () => {
        expect(detectCategoryFromSymbol('TP.TRY10Y')).toBe('TR_BOND');
        expect(detectCategoryFromSymbol('tp.TR2Y')).toBe('TR_BOND');
    });

    it('_EUROBOND suffix → EUROBOND', () => {
        expect(detectCategoryFromSymbol('TR10Y_EUROBOND')).toBe('EUROBOND');
        expect(detectCategoryFromSymbol('TR5Y_EUROBOND')).toBe('EUROBOND');
    });

    it('BIST endeksleri X... → INDEX', () => {
        expect(detectCategoryFromSymbol('XU100')).toBe('INDEX');
        expect(detectCategoryFromSymbol('XU030')).toBe('INDEX');
        expect(detectCategoryFromSymbol('XBANK')).toBe('INDEX');
        expect(detectCategoryFromSymbol('XU100.IS')).toBe('INDEX');
    });

    it('.IS suffix → STOCK', () => {
        expect(detectCategoryFromSymbol('THYAO.IS')).toBe('STOCK');
        expect(detectCategoryFromSymbol('AKBNK.IS')).toBe('STOCK');
    });

    it('F_ prefix veya VADE içeren → VIOP', () => {
        expect(detectCategoryFromSymbol('F_XU100_0626')).toBe('VIOP');
        expect(detectCategoryFromSymbol('TCELL_VADE')).toBe('VIOP');
        expect(detectCategoryFromSymbol('XYZVADELI')).toBe('VIOP');
    });

    it('=X suffix → CURRENCY', () => {
        expect(detectCategoryFromSymbol('USDTRY=X')).toBe('CURRENCY');
        expect(detectCategoryFromSymbol('EURUSD=X')).toBe('CURRENCY');
    });

    it('=F suffix → COMMODITY', () => {
        expect(detectCategoryFromSymbol('GC=F')).toBe('COMMODITY');
        expect(detectCategoryFromSymbol('CL=F')).toBe('COMMODITY');
    });

    it('-USD veya USDT suffix → CRYPTO', () => {
        expect(detectCategoryFromSymbol('BTC-USD')).toBe('CRYPTO');
        expect(detectCategoryFromSymbol('ETH-USD')).toBe('CRYPTO');
        expect(detectCategoryFromSymbol('BTCUSDT')).toBe('CRYPTO');
    });

    it('eşleşmesiz sembol → null', () => {
        expect(detectCategoryFromSymbol('ZZZ123')).toBeNull();
        expect(detectCategoryFromSymbol('HELLO')).toBeNull();
    });

    it("küçük harf gelse de uppercase'e çevirir", () => {
        expect(detectCategoryFromSymbol('thyao.is')).toBe('STOCK');
        expect(detectCategoryFromSymbol('btc-usd')).toBe('CRYPTO');
    });
});

describe('marketsKeyForCategory', () => {
    it('null/undefined → null', () => {
        expect(marketsKeyForCategory(null)).toBeNull();
        expect(marketsKeyForCategory(undefined)).toBeNull();
        expect(marketsKeyForCategory('')).toBeNull();
    });

    it('STOCK → "stocks"', () => expect(marketsKeyForCategory('STOCK')).toBe('stocks'));
    it('CRYPTO → "cryptos"', () => expect(marketsKeyForCategory('CRYPTO')).toBe('cryptos'));
    it('CURRENCY → "currencies"', () => expect(marketsKeyForCategory('CURRENCY')).toBe('currencies'));
    it('BOND → "global_bonds"', () => expect(marketsKeyForCategory('BOND')).toBe('global_bonds'));
    it('TR_BOND → "tr_bonds"', () => expect(marketsKeyForCategory('TR_BOND')).toBe('tr_bonds'));
    it('EUROBOND → "eurobonds"', () => expect(marketsKeyForCategory('EUROBOND')).toBe('eurobonds'));
    it('VIOP → "viop"', () => expect(marketsKeyForCategory('VIOP')).toBe('viop'));
    it('COMMODITY → "commodities"', () => expect(marketsKeyForCategory('COMMODITY')).toBe('commodities'));
    it('INDEX → "indices"', () => expect(marketsKeyForCategory('INDEX')).toBe('indices'));

    it("FUND → her iki array key'i de", () => {
        expect(marketsKeyForCategory('FUND')).toEqual(['global_funds', 'tr_funds']);
    });

    it("lowercase gelse de eşleşir", () => {
        expect(marketsKeyForCategory('stock')).toBe('stocks');
    });

    it('bilinmeyen kategori → null', () => {
        expect(marketsKeyForCategory('UNKNOWN')).toBeNull();
    });
});
