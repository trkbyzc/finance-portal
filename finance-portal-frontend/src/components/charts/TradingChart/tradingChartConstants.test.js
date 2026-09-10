import { describe, it, expect } from 'vitest';
import { BIST_OPTIONS, CRYPTO_OPTIONS, SECTOR_INDEXES, sectorIndexFor, ASSET_COLOR } from './tradingChartConstants';

describe('BIST_OPTIONS', () => {
    it('3 endeks (XU100, XU050, XU030)', () => {
        expect(BIST_OPTIONS).toHaveLength(3);
        expect(BIST_OPTIONS.map(o => o.key)).toEqual(['XU100', 'XU050', 'XU030']);
    });

    it('her endeks TR_INDEX kategorisi', () => {
        BIST_OPTIONS.forEach(o => expect(o.category).toBe('TR_INDEX'));
    });

    it('her endeks color + label', () => {
        BIST_OPTIONS.forEach(o => {
            expect(o.color).toMatch(/^#[0-9a-f]{6}$/i);
            expect(o.label).toMatch(/BIST/);
        });
    });
});

describe('CRYPTO_OPTIONS', () => {
    it('BITW tek endeks', () => {
        expect(CRYPTO_OPTIONS).toHaveLength(1);
        expect(CRYPTO_OPTIONS[0].key).toBe('BITW');
    });
});

describe('SECTOR_INDEXES', () => {
    it('XBANK + XUSIN tanımlı', () => {
        expect(SECTOR_INDEXES.XBANK.key).toBe('XBANK');
        expect(SECTOR_INDEXES.XUSIN.key).toBe('XUSIN');
    });
});

describe('sectorIndexFor', () => {
    it('null/undefined → null', () => {
        expect(sectorIndexFor(null)).toBeNull();
        expect(sectorIndexFor(undefined)).toBeNull();
    });

    it('boş string → null', () => {
        expect(sectorIndexFor('')).toBeNull();
    });

    it('"Banka" içeren sektör → XBANK', () => {
        expect(sectorIndexFor('Bankacılık')).toBe(SECTOR_INDEXES.XBANK);
        expect(sectorIndexFor('Mevduat Bankası')).toBe(SECTOR_INDEXES.XBANK);
    });

    it('case insensitive', () => {
        expect(sectorIndexFor('BANKA')).toBe(SECTOR_INDEXES.XBANK);
        expect(sectorIndexFor('banka')).toBe(SECTOR_INDEXES.XBANK);
    });

    it('banka olmayan → XUSIN', () => {
        expect(sectorIndexFor('Tekstil')).toBe(SECTOR_INDEXES.XUSIN);
        expect(sectorIndexFor('Gıda')).toBe(SECTOR_INDEXES.XUSIN);
    });
});

describe('ASSET_COLOR', () => {
    it('turuncu hex', () => {
        expect(ASSET_COLOR).toBe('#ff9800');
    });
});
