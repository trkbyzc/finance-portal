import { describe, it, expect } from 'vitest';
import { getChartStyles, CHART_TYPES, AVAILABLE_INDICATORS, DRAWING_TOOLS } from './chartConfig';

describe('getChartStyles', () => {
    it('default chart type', () => {
        const styles = getChartStyles();
        expect(styles.candle.type).toBe('candle_solid');
    });

    it('custom chart type', () => {
        const styles = getChartStyles('ohlc');
        expect(styles.candle.type).toBe('ohlc');
    });

    it('grid, axis ve indicator dolu', () => {
        const s = getChartStyles();
        expect(s.grid.show).toBe(true);
        expect(s.xAxis.tickText.color).toBeDefined();
        expect(s.yAxis.axisLine.color).toBeDefined();
        expect(s.indicator.tooltip.showRule).toBeDefined();
    });

    it('Europe/Istanbul timezone', () => {
        expect(getChartStyles().timeZone).toBe('Europe/Istanbul');
    });
});

describe('CHART_TYPES', () => {
    it.each([
        ['CANDLE_SOLID', 'candle_solid'],
        ['CANDLE_STROKE', 'candle_stroke'],
        ['OHLC', 'ohlc'],
        ['AREA', 'area'],
    ])('%s → %s', (key, val) => {
        expect(CHART_TYPES[key]).toBe(val);
    });
});

describe('AVAILABLE_INDICATORS', () => {
    it('6 göstergeli', () => {
        expect(AVAILABLE_INDICATORS).toHaveLength(6);
    });

    it('her gösterge id + name + pane içerir', () => {
        AVAILABLE_INDICATORS.forEach(ind => {
            expect(ind).toHaveProperty('id');
            expect(ind).toHaveProperty('name');
            expect(ind).toHaveProperty('pane');
        });
    });

    it('MA candle_pane', () => {
        const ma = AVAILABLE_INDICATORS.find(i => i.id === 'MA');
        expect(ma.pane).toBe('candle_pane');
    });
});

describe('DRAWING_TOOLS', () => {
    it('5 çizim aracı', () => {
        expect(DRAWING_TOOLS).toHaveLength(5);
    });

    it('temel tool\'lar mevcut', () => {
        const ids = DRAWING_TOOLS.map(t => t.id);
        expect(ids).toContain('segment');
        expect(ids).toContain('ray');
        expect(ids).toContain('fibonacciLine');
    });
});
