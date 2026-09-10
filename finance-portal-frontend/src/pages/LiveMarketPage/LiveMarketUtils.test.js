import { describe, it, expect } from 'vitest';
import { formatIndexName, getFlagUrl, getHeatmapClass } from './LiveMarketUtils';

describe('formatIndexName', () => {
    it('null/boş → ""', () => {
        expect(formatIndexName(null)).toBe('');
        expect(formatIndexName('')).toBe('');
    });
    it('XU100 → BIST 100', () => expect(formatIndexName('XU100.IS')).toBe('BIST 100'));
    it('XU030 → BIST 30', () => expect(formatIndexName('XU030')).toBe('BIST 30'));
    it('XU050 → BIST 50', () => expect(formatIndexName('XU050')).toBe('BIST 50'));
    it('XBANK → BIST BANKA', () => expect(formatIndexName('XBANK')).toBe('BIST BANKA'));
    it('XUSIN → BIST SINAİ', () => expect(formatIndexName('XUSIN')).toBe('BIST SINAİ'));
    it('Bilinmeyen sembol → .IS strip edilir', () => {
        expect(formatIndexName('THYAO.IS')).toBe('THYAO');
        expect(formatIndexName('AAPL')).toBe('AAPL');
    });
});

describe('getFlagUrl', () => {
    it.each([
        ['USD', 'us'],
        ['EUR', 'eu'],
        ['GBP', 'gb'],
        ['JPY', 'jp'],
        ['CAD', 'ca'],
        ['CHF', 'ch'],
    ])('%s → %s', (code, slug) => {
        expect(getFlagUrl(code)).toBe(`https://flagcdn.com/w40/${slug}.png`);
    });

    it("bilinmeyen kod → 'un' fallback (United Nations)", () => {
        expect(getFlagUrl('XYZ')).toBe('https://flagcdn.com/w40/un.png');
    });
});

describe('getHeatmapClass', () => {
    it('null/0 → transparent muted', () => {
        expect(getHeatmapClass(null)).toContain('bg-transparent');
        expect(getHeatmapClass(0)).toContain('bg-transparent');
    });

    it('+0.5 → light green (1\'in altı)', () => {
        const out = getHeatmapClass(0.5);
        expect(out).toContain('089981');
        expect(out).toContain('/20');
    });

    it('+3 → orta green', () => {
        const out = getHeatmapClass(3);
        expect(out).toContain('089981');
        expect(out).toContain('/40');
    });

    it('+10 → koyu green', () => {
        const out = getHeatmapClass(10);
        expect(out).toContain('/70');
    });

    it('+20 → en koyu green', () => {
        const out = getHeatmapClass(20);
        expect(out).toBe('bg-[#089981] text-white');
    });

    it('-0.5 → light red', () => {
        const out = getHeatmapClass(-0.5);
        expect(out).toContain('f23645');
        expect(out).toContain('/20');
    });

    it('-20 → en koyu red', () => {
        const out = getHeatmapClass(-20);
        expect(out).toBe('bg-[#f23645] text-white');
    });
});
