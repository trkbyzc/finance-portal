import { describe, it, expect, vi, beforeEach } from 'vitest';

const { i18nMock } = vi.hoisted(() => ({ i18nMock: { language: 'tr' } }));
vi.mock('../../i18n', () => ({ default: i18nMock }));

import { formatCurrency } from './currencyFormatter';

describe('formatCurrency', () => {
    beforeEach(() => { i18nMock.language = 'tr'; });

    it('null/undefined/NaN → "-"', () => {
        expect(formatCurrency(null)).toBe('-');
        expect(formatCurrency(undefined)).toBe('-');
        expect(formatCurrency(NaN)).toBe('-');
    });

    it('TRY default currency code', () => {
        const out = formatCurrency(1234.5);
        expect(out).toMatch(/₺|TRY|TL/);
    });

    it('USD explicit', () => {
        i18nMock.language = 'en';
        const out = formatCurrency(99.99, 'USD');
        expect(out).toMatch(/\$|USD/);
    });

    it('custom min/max decimals', () => {
        const out = formatCurrency(1.23456, 'TRY', 0, 2);
        expect(out).toMatch(/1,23|1\.23/);
    });

    it('sıfır geçerli format', () => {
        const out = formatCurrency(0, 'USD');
        expect(out).toMatch(/0/);
    });
});
