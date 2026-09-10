import { describe, it, expect } from 'vitest';
import { PALETTE, fmtTry, buildComparisonSeries } from './whatIfHelpers';

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

describe('buildComparisonSeries', () => {
    // Gerçek senaryo: THYAO kaba (aylık, geç başlar), USD sık (06-01'den, hizasız tarihler).
    const result = {
        investmentDate: '2022-06-01',
        assets: [
            {
                key: 'STOCK:THYAO', label: 'THYAO.IS', symbol: 'THYAO',
                series: [
                    { date: '2022-06-30', value: 100 },
                    { date: '2022-07-31', value: 150 },
                    { date: '2022-08-31', value: 200 },
                ],
            },
            {
                key: 'CURRENCY:USD', label: 'USD', symbol: 'USD',
                series: [
                    { date: '2022-06-01', value: 16 },
                    { date: '2022-07-15', value: 18 },
                    { date: '2022-08-31', value: 20 },
                ],
            },
        ],
    };

    it('null / boş input → boş seri', () => {
        expect(buildComparisonSeries(null, 'indexed').chartData).toEqual([]);
        expect(buildComparisonSeries({ assets: [] }, 'indexed').chartData).toEqual([]);
        expect(buildComparisonSeries({ assets: [{ key: 'X', series: [] }] }, 'indexed').sharedStart).toBeNull();
    });

    it('sharedStart = en geç başlayan varlık; limitingLabel onu isimler', () => {
        const { sharedStart, limitingLabel } = buildComparisonSeries(result, 'indexed');
        expect(sharedStart).toBe('2022-06-30'); // THYAO 06-30 > USD 06-01
        expect(limitingLabel).toBe('THYAO.IS');
    });

    it('REGRESYON #2: endeks modunda HER iki varlık da render olur (sadece THYAO değil)', () => {
        const { chartData } = buildComparisonSeries(result, 'indexed');
        expect(chartData.length).toBeGreaterThan(0);
        const thyaoPts = chartData.filter((r) => Number.isFinite(r['STOCK:THYAO'])).length;
        const usdPts = chartData.filter((r) => Number.isFinite(r['CURRENCY:USD'])).length;
        expect(thyaoPts).toBeGreaterThan(1);
        expect(usdPts).toBeGreaterThan(1); // eski bug'da USD = 0 idi
    });

    it('REGRESYON #3: her satırda HER varlık dolu → tooltip eksiksiz', () => {
        const { chartData } = buildComparisonSeries(result, 'absolute');
        chartData.forEach((r) => {
            expect(Number.isFinite(r['STOCK:THYAO'])).toBe(true);
            expect(Number.isFinite(r['CURRENCY:USD'])).toBe(true);
        });
    });

    it('endekste tüm çizgiler sharedStart=100 ten başlar', () => {
        const { chartData } = buildComparisonSeries(result, 'indexed');
        const first = chartData[0];
        expect(first.date).toBe('2022-06-30');
        expect(first['STOCK:THYAO']).toBeCloseTo(100, 6);
        expect(first['CURRENCY:USD']).toBeCloseTo(100, 6);
    });

    it('lineer interpolasyon: USD 06-30 değeri 16..18 arasında (06-01→07-15 çizgisi)', () => {
        const { chartData } = buildComparisonSeries(result, 'absolute');
        const row = chartData.find((r) => r.date === '2022-06-30');
        expect(row['CURRENCY:USD']).toBeGreaterThan(16);
        expect(row['CURRENCY:USD']).toBeLessThan(18);
    });

    it('gerçek noktalar korunur (07-31 THYAO=150 birebir)', () => {
        const { chartData } = buildComparisonSeries(result, 'absolute');
        const row = chartData.find((r) => r.date === '2022-07-31');
        expect(row['STOCK:THYAO']).toBe(150);
    });
});
