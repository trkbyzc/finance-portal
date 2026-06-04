import { describe, it, expect } from 'vitest';
import { getViopChartStyles, VIOP_RANGE_OPTIONS } from './viopChartConfig';

describe('getViopChartStyles', () => {
    it('candle type = area', () => {
        expect(getViopChartStyles().candle.type).toBe('area');
    });

    it('mavi area lineColor', () => {
        expect(getViopChartStyles().candle.area.lineColor).toBe('#2962ff');
    });

    it('grid horizontal görünür, vertical gizli', () => {
        const s = getViopChartStyles();
        expect(s.grid.horizontal.show).toBe(true);
        expect(s.grid.vertical.show).toBe(false);
    });

    it('yAxis sağ tarafa konumlandırılmış', () => {
        expect(getViopChartStyles().yAxis.position).toBe('right');
    });

    it('Europe/Istanbul timezone', () => {
        expect(getViopChartStyles().timeZone).toBe('Europe/Istanbul');
    });
});

describe('VIOP_RANGE_OPTIONS', () => {
    it('3 range: 1w, 1mo, 1y', () => {
        expect(VIOP_RANGE_OPTIONS).toHaveLength(3);
        expect(VIOP_RANGE_OPTIONS.map(r => r.id)).toEqual(['1w', '1mo', '1y']);
    });

    it('her range için days hesaplanmış', () => {
        const wk = VIOP_RANGE_OPTIONS.find(r => r.id === '1w');
        const mo = VIOP_RANGE_OPTIONS.find(r => r.id === '1mo');
        const yr = VIOP_RANGE_OPTIONS.find(r => r.id === '1y');
        expect(wk.days).toBe(7);
        expect(mo.days).toBe(30);
        expect(yr.days).toBe(365);
    });
});
