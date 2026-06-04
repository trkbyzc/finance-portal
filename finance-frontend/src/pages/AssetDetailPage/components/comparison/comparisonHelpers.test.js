import { describe, it, expect } from 'vitest';
import { COMPARISON_COLORS, formatPriceLabel } from './comparisonHelpers';

describe('COMPARISON_COLORS', () => {
    it('6 renk içerir', () => {
        expect(COMPARISON_COLORS).toHaveLength(6);
        COMPARISON_COLORS.forEach(c => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
    });
});

describe('formatPriceLabel', () => {
    it('null/NaN → ""', () => {
        expect(formatPriceLabel(null, 'TRY')).toBe('');
        expect(formatPriceLabel(NaN, 'USD')).toBe('');
    });

    it('TRY → ₺ prefix', () => {
        expect(formatPriceLabel(100, 'TRY')).toMatch(/^₺/);
    });

    it('USD → $ prefix', () => {
        expect(formatPriceLabel(100, 'USD')).toMatch(/^\$/);
    });

    it('>= 1M → "M" format 2 ondalık', () => {
        expect(formatPriceLabel(2_500_000, 'USD')).toBe('$2.50M');
    });

    it('>= 1K (< 1M) → "K" format 1 ondalık', () => {
        expect(formatPriceLabel(5500, 'USD')).toBe('$5.5K');
    });

    it('< 1 → 4 ondalık', () => {
        const out = formatPriceLabel(0.1234, 'USD');
        expect(out).toMatch(/0\.1234/);
    });

    it('1-1000 arası → 2 ondalık', () => {
        const out = formatPriceLabel(99.99, 'USD');
        expect(out).toMatch(/99\.99/);
    });

    it('TRY locale virgül ondalık', () => {
        const out = formatPriceLabel(99.99, 'TRY');
        expect(out).toMatch(/99,99/);
    });
});
