import { describe, it, expect } from 'vitest';
import { ASSET_COLORS, DEFAULT_COLOR, buildSymbolShades, fmtTry, tooltipStyle } from './portfolioChartColors';

describe('ASSET_COLORS', () => {
    it('7 asset type için renk paleti var', () => {
        const keys = Object.keys(ASSET_COLORS);
        expect(keys).toHaveLength(7);
        expect(keys).toContain('STOCK');
        expect(keys).toContain('CRYPTO');
        expect(keys).toContain('FUTURE');
    });

    it('her renk base + light pair\'i', () => {
        Object.values(ASSET_COLORS).forEach(c => {
            expect(c).toHaveProperty('base');
            expect(c).toHaveProperty('light');
            expect(c.base).toMatch(/^#[0-9a-f]{6}$/i);
            expect(c.light).toMatch(/^#[0-9a-f]{6}$/i);
        });
    });
});

describe('DEFAULT_COLOR', () => {
    it('slate (gray) varsayılan renk', () => {
        expect(DEFAULT_COLOR.base).toMatch(/^#[0-9a-f]{6}$/i);
        expect(DEFAULT_COLOR.light).toMatch(/^#[0-9a-f]{6}$/i);
    });
});

describe('buildSymbolShades', () => {
    it('8 ton döner', () => {
        const shades = buildSymbolShades('#3b82f6');
        expect(shades).toHaveLength(8);
    });

    it('ilk shade input ile aynı', () => {
        const shades = buildSymbolShades('#3b82f6');
        expect(shades[0].base).toBe('#3b82f6');
    });

    it('her shade base + light pair\'i', () => {
        const shades = buildSymbolShades('#3b82f6');
        shades.forEach(s => {
            expect(s.base).toMatch(/^#[0-9a-f]{6}$/i);
            expect(s.light).toMatch(/^#[0-9a-f]{6}$/i);
        });
    });
});

describe('fmtTry', () => {
    it('null/undefined → "0,00"', () => {
        expect(fmtTry(null)).toBe('0,00');
        expect(fmtTry(undefined)).toBe('0,00');
    });
    it('sayı → TR locale (virgül ondalık, nokta ayraç)', () => {
        expect(fmtTry(1234.5)).toMatch(/1\.234,50|1 234,50/);
    });
    it('2 ondalık zorunlu', () => {
        expect(fmtTry(100)).toBe('100,00');
    });
});

describe('tooltipStyle', () => {
    it('CSS variable referansları içerir', () => {
        expect(tooltipStyle.backgroundColor).toBe('var(--color-surface)');
        expect(tooltipStyle.border).toContain('var(--color-border)');
        expect(tooltipStyle.color).toBe('var(--color-text)');
    });

    it('boxShadow + padding ayarlı', () => {
        expect(tooltipStyle.boxShadow).toMatch(/rgba/);
        expect(tooltipStyle.padding).toBeDefined();
    });
});
