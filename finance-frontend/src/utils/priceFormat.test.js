import { describe, it, expect } from 'vitest';
import { computePricePrecision, computePriceLabelDigits } from './priceFormat';

describe('computePricePrecision', () => {
    it('geçersiz değer → 2', () => {
        expect(computePricePrecision(null)).toBe(2);
        expect(computePricePrecision(undefined)).toBe(2);
        expect(computePricePrecision(NaN)).toBe(2);
        expect(computePricePrecision(Infinity)).toBe(2);
        expect(computePricePrecision(-5)).toBe(2);
        expect(computePricePrecision(0)).toBe(2);
    });

    it('maxPrice >= 100 → 2 ondalık', () => {
        expect(computePricePrecision(150)).toBe(2);
        expect(computePricePrecision(10000)).toBe(2);
    });

    it('1 <= maxPrice < 100 → 4 ondalık', () => {
        expect(computePricePrecision(1)).toBe(4);
        expect(computePricePrecision(50)).toBe(4);
        expect(computePricePrecision(99.99)).toBe(4);
    });

    it('0.1 → 0 öncü sıfır + 5 = 5 ondalık', () => {
        expect(computePricePrecision(0.1)).toBe(5);
    });

    it('0.001 → 2 öncü sıfır + 5 = 7 ondalık', () => {
        expect(computePricePrecision(0.001)).toBe(7);
    });

    it('aşırı küçük → 15 ondalık cap', () => {
        expect(computePricePrecision(1e-20)).toBe(15);
    });
});

describe('computePriceLabelDigits', () => {
    it('null/NaN/0 → 2', () => {
        expect(computePriceLabelDigits(null)).toBe(2);
        expect(computePriceLabelDigits(NaN)).toBe(2);
        expect(computePriceLabelDigits(0)).toBe(2);
    });

    it('|value| >= 1 → 2', () => {
        expect(computePriceLabelDigits(1)).toBe(2);
        expect(computePriceLabelDigits(100)).toBe(2);
        expect(computePriceLabelDigits(-5)).toBe(2);
    });

    it('0.1 → 0 öncü sıfır + 4 = 4', () => {
        expect(computePriceLabelDigits(0.1)).toBe(4);
    });

    it('0.001 → 2 öncü sıfır + 4 = 6', () => {
        expect(computePriceLabelDigits(0.001)).toBe(6);
    });

    it("negatif fiyatın absolute'unu alır", () => {
        expect(computePriceLabelDigits(-0.001)).toBe(6);
    });

    it('aşırı küçük → 15 cap', () => {
        expect(computePriceLabelDigits(1e-30)).toBe(15);
    });
});
