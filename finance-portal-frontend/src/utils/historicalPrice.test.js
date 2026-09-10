import { describe, it, expect, vi, beforeEach } from 'vitest';

const { historicalApiMock } = vi.hoisted(() => ({
    historicalApiMock: { getCustomRange: vi.fn() }
}));
vi.mock('../services/api', () => ({ historicalApi: historicalApiMock }));

import { historicalCategory, fetchPriceOnDate } from './historicalPrice';

describe('historicalCategory', () => {
    it.each([
        ['STOCK', 'X', 'STOCK'],
        ['CRYPTO', 'X', 'CRYPTO'],
        ['CURRENCY', 'X', 'CURRENCY'],
        ['COMMODITY', 'X', 'COMMODITY'],
        ['FUTURE', 'X', 'VIOP'],
        ['FUND', 'X', 'TR_FUND'],
    ])('%s → %s', (type, sym, expected) => {
        expect(historicalCategory(type, sym)).toBe(expected);
    });

    it('BOND + TP. prefix → TR_BOND', () => {
        expect(historicalCategory('BOND', 'TP.TR10Y')).toBe('TR_BOND');
    });

    it('BOND + global → BOND', () => {
        expect(historicalCategory('BOND', '^TNX')).toBe('BOND');
    });

    it('bilinmeyen tip → kendisi (fallback)', () => {
        expect(historicalCategory('XYZ', '')).toBe('XYZ');
    });

    it('null type + null symbol → null', () => {
        expect(historicalCategory(null, null)).toBeNull();
    });
});

describe('fetchPriceOnDate', () => {
    beforeEach(() => {
        historicalApiMock.getCustomRange.mockReset();
    });

    it('boş symbol → null', async () => {
        expect(await fetchPriceOnDate('', 'STOCK', '2026-01-15')).toBeNull();
    });

    it('boş dateStr → null', async () => {
        expect(await fetchPriceOnDate('AAPL', 'STOCK', '')).toBeNull();
    });

    it('bilinmeyen category → null', async () => {
        // historicalCategory null dönüyorsa fetch yapılmaz
        const result = await fetchPriceOnDate('AAPL', null, '2026-01-15');
        // null type → category = null → null
        expect(result).toBeNull();
    });

    it('istenen tarihte/öncesinde en yakın gün döner', async () => {
        historicalApiMock.getCustomRange.mockResolvedValue([
            { date: '2026-01-13', close: 100 },
            { date: '2026-01-14', close: 105 },
            { date: '2026-01-15', close: 110 },
        ]);
        expect(await fetchPriceOnDate('AAPL', 'STOCK', '2026-01-15')).toBe(110);
    });

    it('istenen tarihten önceki en yakın günü kullanır (boşluk varsa)', async () => {
        historicalApiMock.getCustomRange.mockResolvedValue([
            { date: '2026-01-13', close: 100 },
            { date: '2026-01-14', close: 105 },
        ]);
        // 2026-01-15 için veri yok → 14 OK
        expect(await fetchPriceOnDate('AAPL', 'STOCK', '2026-01-15')).toBe(105);
    });

    it('sadece sonrasi tarihler varsa → null (forward leak guard)', async () => {
        historicalApiMock.getCustomRange.mockResolvedValue([
            { date: '2026-01-16', close: 200 },
            { date: '2026-01-17', close: 210 },
        ]);
        expect(await fetchPriceOnDate('USD', 'CURRENCY', '2026-01-15')).toBeNull();
    });

    it('priceData nested response → array çıkar', async () => {
        historicalApiMock.getCustomRange.mockResolvedValue({
            priceData: [{ date: '2026-01-15', close: 50 }]
        });
        expect(await fetchPriceOnDate('X', 'STOCK', '2026-01-15')).toBe(50);
    });

    it('array [yyyy, m, d] date format', async () => {
        historicalApiMock.getCustomRange.mockResolvedValue([
            { date: [2026, 1, 15], close: 88 },
        ]);
        expect(await fetchPriceOnDate('X', 'STOCK', '2026-01-15')).toBe(88);
    });

    it('boş array → null', async () => {
        historicalApiMock.getCustomRange.mockResolvedValue([]);
        expect(await fetchPriceOnDate('X', 'STOCK', '2026-01-15')).toBeNull();
    });

    it('NaN close → filtrelenir', async () => {
        historicalApiMock.getCustomRange.mockResolvedValue([
            { date: '2026-01-15', close: 'not-a-number' },
        ]);
        expect(await fetchPriceOnDate('X', 'STOCK', '2026-01-15')).toBeNull();
    });

    it('exception → null (best-effort)', async () => {
        historicalApiMock.getCustomRange.mockRejectedValue(new Error('network'));
        expect(await fetchPriceOnDate('X', 'STOCK', '2026-01-15')).toBeNull();
    });

    it("'price' field fallback (close yoksa)", async () => {
        historicalApiMock.getCustomRange.mockResolvedValue([
            { date: '2026-01-15', price: 77 },
        ]);
        expect(await fetchPriceOnDate('X', 'STOCK', '2026-01-15')).toBe(77);
    });
});
