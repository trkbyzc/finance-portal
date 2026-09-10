import { describe, it, expect } from 'vitest';
import {
    normalizeSymbol, getDisplayName, isTurkishBond, isTurkishGold, getChartType
} from './symbolUtils';

describe('normalizeSymbol', () => {
    it('TR altını sembolü olduğu gibi döner', () => {
        expect(normalizeSymbol({ symbol: 'GRAM_ALTIN' })).toBe('GRAM_ALTIN');
        expect(normalizeSymbol({ symbol: '22_AYAR_BILEZIK' })).toBe('22_AYAR_BILEZIK');
    });

    it("TR altını yahooSymbol'ü override etmez", () => {
        expect(normalizeSymbol({ symbol: 'GRAM_ALTIN', yahooSymbol: 'XAUTRY=X' })).toBe('GRAM_ALTIN');
    });

    it('yahooSymbol varsa kullanır', () => {
        expect(normalizeSymbol({ symbol: 'THYAO', yahooSymbol: 'THYAO.IS' })).toBe('THYAO.IS');
    });

    it('CRYPTO_LIST içinde olan bare crypto → -USD eklenir', () => {
        expect(normalizeSymbol({ symbol: 'BTC' })).toBe('BTC-USD');
        expect(normalizeSymbol({ symbol: 'ETH' })).toBe('ETH-USD');
    });

    it('USDT suffix temizlenir', () => {
        expect(normalizeSymbol({ symbol: 'USDT', assetCategory: 'CRYPTO' })).toBe('-USD');
    });

    it('zaten -USD varsa eklemez', () => {
        expect(normalizeSymbol({ symbol: 'BTC-USD' })).toBe('BTC-USD');
    });

    it('assetCategory=CRYPTO ile mark edilenler', () => {
        expect(normalizeSymbol({ symbol: 'XYZ', assetCategory: 'CRYPTO' })).toBe('XYZ-USD');
    });

    it('hiç sembol yoksa default XU100.IS', () => {
        expect(normalizeSymbol({})).toBe('XU100.IS');
    });

    it('currencyCode fallback', () => {
        expect(normalizeSymbol({ currencyCode: 'EUR' })).toBe('EUR');
    });
});

describe('getDisplayName', () => {
    it('asset.name varsa onu kullanır', () => {
        expect(getDisplayName({ name: 'Apple Inc.' }, 'AAPL')).toBe('Apple Inc.');
    });

    it('asset.currencyName fallback', () => {
        expect(getDisplayName({ currencyName: 'Türk Lirası' }, 'TRY')).toBe('Türk Lirası');
    });

    it('hiçbiri yoksa backendSymbol\'den suffix\'leri çıkarır', () => {
        expect(getDisplayName({}, 'THYAO.IS')).toBe('THYAO');
        expect(getDisplayName({}, 'USDTRY=X')).toBe('USDTRY');
        expect(getDisplayName({}, 'BTC-USD')).toBe('BTC');
    });
});

describe('isTurkishBond', () => {
    it('"TP." ile başlıyorsa true', () => {
        expect(isTurkishBond('TP.TRY10Y')).toBe(true);
    });
    it('aksi false', () => {
        expect(isTurkishBond('THYAO.IS')).toBe(false);
        expect(isTurkishBond('BTC')).toBe(false);
    });
});

describe('isTurkishGold', () => {
    it('null/undefined/non-string → false', () => {
        expect(isTurkishGold(null)).toBe(false);
        expect(isTurkishGold(undefined)).toBe(false);
        expect(isTurkishGold(123)).toBe(false);
    });

    it('ALTIN içeren sembol → true', () => {
        expect(isTurkishGold('GRAM_ALTIN')).toBe(true);
        expect(isTurkishGold('CEYREK_ALTIN')).toBe(true);
    });

    it('BILEZIK içeren sembol → true', () => {
        expect(isTurkishGold('22_AYAR_BILEZIK')).toBe(true);
    });

    it('aksi false', () => {
        expect(isTurkishGold('THYAO')).toBe(false);
    });

    it("lowercase'a duyarsız", () => {
        expect(isTurkishGold('gram_altin')).toBe(true);
    });
});

describe('getChartType', () => {
    it('chartType=LINE explicit → LINE', () => {
        expect(getChartType({ chartType: 'LINE' })).toBe('LINE');
    });

    it.each(['BOND', 'FUND', 'EUROBOND'])('assetCategory %s → LINE', (cat) => {
        expect(getChartType({ assetCategory: cat })).toBe('LINE');
    });

    it('TR altını → LINE', () => {
        expect(getChartType({ symbol: 'GRAM_ALTIN' })).toBe('LINE');
    });

    it('chartType=NONE explicit → NONE', () => {
        expect(getChartType({ chartType: 'NONE' })).toBe('NONE');
    });

    it('default → CANDLE', () => {
        expect(getChartType({ symbol: 'THYAO.IS' })).toBe('CANDLE');
        expect(getChartType({})).toBe('CANDLE');
    });
});
