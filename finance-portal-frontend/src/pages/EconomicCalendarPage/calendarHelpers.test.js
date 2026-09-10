import { describe, it, expect } from 'vitest';
import {
    IMPACT_LEVELS, MAJOR_COUNTRIES, todayIso, isoOffset,
    fmtTime, fmtDateHeader, fmtNum, impactDotClass
} from './calendarHelpers';

describe('calendarHelpers constants', () => {
    it('IMPACT_LEVELS 3 öğeli (LOW/MEDIUM/HIGH)', () => {
        expect(IMPACT_LEVELS).toHaveLength(3);
        expect(IMPACT_LEVELS.map(l => l.value)).toEqual(['LOW', 'MEDIUM', 'HIGH']);
    });
    it('MAJOR_COUNTRIES temel ülkeler içerir', () => {
        expect(MAJOR_COUNTRIES).toContain('TR');
        expect(MAJOR_COUNTRIES).toContain('US');
        expect(MAJOR_COUNTRIES.length).toBeGreaterThanOrEqual(8);
    });
});

describe('todayIso', () => {
    it('bugünün ISO YYYY-MM-DD formatı', () => {
        expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe('isoOffset', () => {
    it('+7 → bugünden 7 gün sonra', () => {
        const d = isoOffset(7);
        const now = new Date();
        const expected = new Date();
        expected.setDate(now.getDate() + 7);
        expect(d).toBe(expected.toISOString().slice(0, 10));
    });
    it('-7 → bugünden 7 gün önce', () => {
        expect(isoOffset(-7)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe('fmtTime', () => {
    it('null/boş → "—"', () => {
        expect(fmtTime(null)).toBe('—');
        expect(fmtTime('')).toBe('—');
    });
    it('ISO → HH:MM TR formatı', () => {
        expect(fmtTime('2026-06-04T14:30:00Z')).toMatch(/^\d{2}:\d{2}$/);
    });
});

describe('fmtDateHeader', () => {
    it('YYYY-MM-DD → uzun TR tarih', () => {
        const out = fmtDateHeader('2026-06-04');
        expect(out).toMatch(/Haziran|Perşembe|2026/i);
    });
});

describe('fmtNum', () => {
    it('null/undefined → "—"', () => {
        expect(fmtNum(null)).toBe('—');
        expect(fmtNum(undefined)).toBe('—');
    });
    it('NaN string → "—"', () => {
        expect(fmtNum('abc')).toBe('—');
    });
    it('< 1000 → 4 ondalık', () => {
        expect(fmtNum(12.3456)).toMatch(/12,3456|12\.3456/);
    });
    it('>= 1000 → 2 ondalık + ayraç', () => {
        const out = fmtNum(12345.67);
        expect(out).toMatch(/12\.345,67|12,345\.67/);
    });
    it('% birimiyle', () => {
        expect(fmtNum(5.5, '%')).toMatch(/5,5%|5\.5%/);
    });
    it('birim space ile (% hariç)', () => {
        expect(fmtNum(100, 'kg')).toMatch(/100 kg/);
    });
});

describe('impactDotClass', () => {
    it('LOW → bg-text-muted', () => expect(impactDotClass('LOW')).toBe('bg-text-muted'));
    it('MEDIUM → bg-warning', () => expect(impactDotClass('MEDIUM')).toBe('bg-warning'));
    it('HIGH → bg-sell', () => expect(impactDotClass('HIGH')).toBe('bg-sell'));
    it('bilinmeyen → muted fallback', () => {
        expect(impactDotClass('XYZ')).toBe('bg-text-muted');
        expect(impactDotClass(null)).toBe('bg-text-muted');
    });
});
