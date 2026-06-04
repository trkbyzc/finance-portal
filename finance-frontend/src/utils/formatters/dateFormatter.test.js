import { describe, it, expect, vi, beforeEach } from 'vitest';

const { i18nMock } = vi.hoisted(() => ({ i18nMock: { language: 'tr' } }));
vi.mock('../../i18n', () => ({ default: i18nMock }));

import {
    formatDate, formatDateTime, formatChartDate, formatKlineDate,
    formatDateLong, formatTimeAgo
} from './dateFormatter';

describe('dateFormatter', () => {
    beforeEach(() => { i18nMock.language = 'tr'; });

    describe('formatDate', () => {
        it('null → "-"', () => expect(formatDate(null)).toBe('-'));
        it('undefined → "-"', () => expect(formatDate(undefined)).toBe('-'));
        it('boş string → "-"', () => expect(formatDate('')).toBe('-'));
        it('geçersiz string → "-"', () => expect(formatDate('not-a-date')).toBe('-'));

        it('ISO string GG.AA.YYYY döner (TR)', () => {
            expect(formatDate('2026-06-04')).toMatch(/^04[./]06[./]2026$/);
        });

        it('Date object kabul eder', () => {
            const d = new Date(2026, 5, 4);
            expect(formatDate(d)).toMatch(/04/);
        });

        it('array [yyyy, m, d] formatı parse eder', () => {
            expect(formatDate([2026, 6, 4])).toMatch(/04/);
        });

        it('EN locale → MM/DD/YYYY benzeri', () => {
            i18nMock.language = 'en';
            const out = formatDate('2026-06-04');
            // EN formatı "06/04/2026" veya benzeri
            expect(out).toMatch(/06.*04|04.*06/);
        });
    });

    describe('formatDateTime', () => {
        it('saat ekler', () => {
            const out = formatDateTime('2026-06-04T14:30');
            expect(out).toMatch(/14:30|02:30/); // 12/24h farkı toleransı
        });
        it('null → "-"', () => expect(formatDateTime(null)).toBe('-'));
    });

    describe('formatChartDate', () => {
        it('boş/null → ""', () => {
            expect(formatChartDate(null)).toBe('');
            expect(formatChartDate('')).toBe('');
        });

        it('geçersiz string → kendisini döndürür', () => {
            expect(formatChartDate('foobar')).toBe('foobar');
        });

        it('YYYY-MM-DD → GG.AA.YYYY veya benzeri', () => {
            const out = formatChartDate('2026-06-04');
            expect(out).toMatch(/04/);
        });

        it('saat içeriyorsa saat de eklenir', () => {
            const out = formatChartDate('2026-06-04 14:30');
            expect(out).toMatch(/14:30|02:30/);
        });
    });

    describe('formatKlineDate', () => {
        it('geçersiz timestamp → ""', () => {
            expect(formatKlineDate(NaN)).toBe('');
        });

        it('YYYY + HH → tam tarih+saat', () => {
            const ts = new Date(2026, 5, 4, 14, 30).getTime();
            expect(formatKlineDate(ts, 'YYYY-MM-DD HH:mm')).toBe('04.06.2026 14:30');
        });

        it('Sadece HH → "HH:mm"', () => {
            const ts = new Date(2026, 5, 4, 9, 5).getTime();
            expect(formatKlineDate(ts, 'HH:mm')).toBe('09:05');
        });

        it('Sadece YYYY → "GG.AA.YYYY"', () => {
            const ts = new Date(2026, 5, 4).getTime();
            expect(formatKlineDate(ts, 'YYYY-MM-DD')).toBe('04.06.2026');
        });

        it('Default format → "GG.AA" (kısa eksen)', () => {
            const ts = new Date(2026, 5, 4).getTime();
            expect(formatKlineDate(ts)).toBe('04.06');
        });
    });

    describe('formatDateLong', () => {
        it('null → "-"', () => expect(formatDateLong(null)).toBe('-'));
        it('YYYY-MM-DD → "4 Haziran 2026" gibi', () => {
            const out = formatDateLong('2026-06-04');
            expect(out).toMatch(/4|04/);
            expect(out).toMatch(/2026/);
        });
    });

    describe('formatTimeAgo', () => {
        it('null → "-"', () => expect(formatTimeAgo(null)).toBe('-'));

        it('1 dk önce', () => {
            const oneMinAgo = new Date(Date.now() - 60 * 1000);
            expect(formatTimeAgo(oneMinAgo)).toMatch(/önce|ago|şimdi|now/i);
        });

        it('1 gün önce', () => {
            const dayAgo = new Date(Date.now() - 86400 * 1000);
            expect(formatTimeAgo(dayAgo)).toMatch(/gün|day|dün|yesterday/i);
        });
    });
});
