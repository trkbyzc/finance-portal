import { describe, it, expect } from 'vitest';
import { PALETTE, fmtTry } from './whatIfHelpers';

describe('whatIfHelpers', () => {
    it('PALETTE 8 renkten oluşur', () => {
        expect(PALETTE).toHaveLength(8);
        PALETTE.forEach(c => expect(c).toMatch(/^#[0-9a-fA-F]{6}$/));
    });

    it('fmtTry → TR locale 2 ondalık', () => {
        expect(fmtTry(1234.5)).toMatch(/1\.234,50/);
    });

    it('fmtTry null/undefined → "0,00"', () => {
        expect(fmtTry(null)).toMatch(/^0,00$/);
        expect(fmtTry(undefined)).toMatch(/^0,00$/);
    });

    it('fmtTry 0 → "0,00"', () => {
        expect(fmtTry(0)).toMatch(/^0,00$/);
    });

    it('fmtTry NaN → "NaN" benzeri tolerans', () => {
        const out = fmtTry('abc');
        expect(out).toBeTruthy();
    });

    it('fmtTry milyon → 3 binlik separator', () => {
        expect(fmtTry(1234567.89)).toMatch(/1\.234\.567,89/);
    });
});
