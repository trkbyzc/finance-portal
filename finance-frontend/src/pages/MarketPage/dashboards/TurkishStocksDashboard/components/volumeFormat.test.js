import { describe, it, expect } from 'vitest';
import { formatCompactVolume } from './volumeFormat';

describe('formatCompactVolume', () => {
    it('null/undefined → "-"', () => {
        expect(formatCompactVolume(null)).toBe('-');
        expect(formatCompactVolume(undefined)).toBe('-');
    });

    it('0 → "-"', () => expect(formatCompactVolume(0)).toBe('-'));
    it('negatif → "-"', () => expect(formatCompactVolume(-100)).toBe('-'));
    it('NaN → "-"', () => expect(formatCompactVolume(NaN)).toBe('-'));
    it('Infinity → "-"', () => expect(formatCompactVolume(Infinity)).toBe('-'));

    it('1.2 milyar → "1,2B"', () => {
        expect(formatCompactVolume(1_200_000_000)).toBe('1,2B');
    });

    it('950 milyon → "950,0M"', () => {
        expect(formatCompactVolume(950_000_000)).toBe('950,0M');
    });

    it('650K formatı', () => {
        expect(formatCompactVolume(650_000)).toBe('650,0K');
    });

    it('< 1000 → TR locale, ondalıksız', () => {
        expect(formatCompactVolume(999)).toBe('999');
        expect(formatCompactVolume(500)).toBe('500');
    });
});
