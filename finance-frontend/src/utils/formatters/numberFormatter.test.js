import { describe, it, expect, vi, beforeEach } from 'vitest';

// i18n mock — vi.hoisted ile (vi.mock hoisted çalıştığı için sıralama önemli)
const { i18nMock } = vi.hoisted(() => ({ i18nMock: { language: 'tr' } }));
vi.mock('../../i18n', () => ({ default: i18nMock }));

import { formatNumber, formatPercent, formatCompactNumber } from './numberFormatter';

describe('numberFormatter', () => {
    beforeEach(() => { i18nMock.language = 'tr'; });

    describe('formatNumber', () => {
        it('null → "-"', () => expect(formatNumber(null)).toBe('-'));
        it('undefined → "-"', () => expect(formatNumber(undefined)).toBe('-'));
        it('NaN → "-"', () => expect(formatNumber(NaN)).toBe('-'));

        it('TR locale → ondalık , ayraçı', () => {
            expect(formatNumber(1234.5)).toMatch(/1\.234,50|1 234,50/);
        });

        it('EN locale → ondalık . ayraçı', () => {
            i18nMock.language = 'en';
            expect(formatNumber(1234.5)).toMatch(/^1,234\.50$/);
        });

        it('custom max/min decimals', () => {
            expect(formatNumber(1.23456, 0, 4)).toMatch(/1,2346|1.2346/);
        });

        it('sıfır geçerli — "0,00"', () => {
            expect(formatNumber(0)).toMatch(/^0,00$|^0\.00$/);
        });
    });

    describe('formatPercent', () => {
        it('null → TR default %0,00', () => {
            expect(formatPercent(null)).toBe('%0,00');
        });

        it('null → EN default 0.00%', () => {
            i18nMock.language = 'en';
            expect(formatPercent(null)).toBe('0.00%');
        });

        it('pozitif değer TR → +%X,YY format', () => {
            expect(formatPercent(12.3)).toBe('+%12,30');
        });

        it('negatif değer TR → -%X,YY (abs ile format)', () => {
            expect(formatPercent(-5.5)).toBe('-%5,50');
        });

        it('sıfır → "%0,00" (sign yok)', () => {
            expect(formatPercent(0)).toBe('%0,00');
        });

        it('EN locale → sayı sonunda %, sign önde', () => {
            i18nMock.language = 'en';
            expect(formatPercent(7.5)).toBe('+7.50%');
            expect(formatPercent(-3)).toBe('-3.00%');
        });
    });

    describe('formatCompactNumber', () => {
        it('null/NaN → "-"', () => {
            expect(formatCompactNumber(null)).toBe('-');
            expect(formatCompactNumber(NaN)).toBe('-');
        });

        it('1500 → "1,5 B" TR veya "1.5K" EN', () => {
            const tr = formatCompactNumber(1500);
            i18nMock.language = 'en';
            const en = formatCompactNumber(1500);
            expect(tr.length).toBeGreaterThan(0);
            expect(en).toMatch(/1\.5K|1,5K/);
        });

        it('1000000 → milyon notasyon', () => {
            i18nMock.language = 'en';
            expect(formatCompactNumber(1_000_000)).toMatch(/^1M$/);
        });
    });
});
