import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { historyMock } = vi.hoisted(() => ({
    historyMock: { getData: vi.fn() },
}));
vi.mock('../../../services/api', () => ({ historicalApi: historyMock }));
vi.mock('../../../utils/historicalPrice', () => ({
    historicalCategory: (assetType) => assetType, // identity → kategori non-null
}));

import useRiskAnalytics from './useRiskAnalytics';

const wrap = () => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }) => <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

beforeEach(() => historyMock.getData.mockReset());

describe('useRiskAnalytics', () => {
    it('boş portfolio → ready=false, weights=[]', () => {
        const { result } = renderHook(() => useRiskAnalytics([], () => ({ currentValue: 0 })), { wrapper: wrap() });
        expect(result.current.ready).toBe(false);
        expect(result.current.weights).toEqual([]);
    });

    it('symbol/quantity yok → filtrelenir, query açılmaz', () => {
        const { result } = renderHook(
            () => useRiskAnalytics([{ symbol: '', quantity: 0 }], () => ({})),
            { wrapper: wrap() }
        );
        expect(result.current.ready).toBe(false);
        expect(historyMock.getData).not.toHaveBeenCalled();
    });

    it('totalValue 0 → ready=false (base)', async () => {
        const days = Array.from({ length: 30 }, (_, i) => ({
            date: `2026-01-${String(i + 1).padStart(2, '0')}`,
            close: 100 + i,
        }));
        historyMock.getData.mockResolvedValue(days);

        const pf = [{ symbol: 'X', assetType: 'STOCK', quantity: 1 }];
        const calc = () => ({ currentValue: 0 });
        const { result } = renderHook(() => useRiskAnalytics(pf, calc), { wrapper: wrap() });
        await waitFor(() => expect(historyMock.getData).toHaveBeenCalled());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.ready).toBe(false);
    });

    it('21 günden az ortak tarih → insufficient=true', async () => {
        const fewDays = Array.from({ length: 10 }, (_, i) => ({
            date: `2026-01-${String(i + 1).padStart(2, '0')}`,
            close: 100 + i,
        }));
        historyMock.getData.mockResolvedValue(fewDays);
        const pf = [{ symbol: 'X', assetType: 'STOCK', quantity: 1 }];
        const calc = () => ({ currentValue: 1000 });
        const { result } = renderHook(() => useRiskAnalytics(pf, calc), { wrapper: wrap() });
        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(result.current.insufficient).toBe(true);
    });

    it('yeterli veri → metrics + correlation hesaplanır', async () => {
        const days = Array.from({ length: 40 }, (_, i) => ({
            date: `2026-01-${String(i + 1).padStart(2, '0')}`,
            close: 100 + i,
        }));
        historyMock.getData.mockResolvedValue(days);
        const pf = [
            { symbol: 'A', assetType: 'STOCK', quantity: 1 },
            { symbol: 'B', assetType: 'STOCK', quantity: 1 },
        ];
        const calc = (h) => ({ currentValue: h.symbol === 'A' ? 700 : 300 });

        const { result } = renderHook(() => useRiskAnalytics(pf, calc), { wrapper: wrap() });
        await waitFor(() => expect(result.current.ready).toBe(true), { timeout: 4000 });

        expect(result.current.insufficient).toBe(false);
        expect(result.current.metrics).toBeTruthy();
        expect(result.current.metrics.hhi).toBeGreaterThan(0);
        expect(result.current.metrics.effectiveAssets).toBeGreaterThan(0);
        expect(result.current.metrics.topSymbol).toBe('A');
        expect(result.current.correlation.symbols).toEqual(['A', 'B']);
        expect(result.current.correlation.matrix.length).toBe(2);
    });

    it('weights normalize edilir, toplam ≈ 1', async () => {
        const days = Array.from({ length: 30 }, (_, i) => ({
            date: `2026-01-${String(i + 1).padStart(2, '0')}`,
            close: 100,
        }));
        historyMock.getData.mockResolvedValue(days);
        const pf = [
            { symbol: 'A', assetType: 'STOCK', quantity: 1 },
            { symbol: 'B', assetType: 'STOCK', quantity: 1 },
        ];
        const calc = (h) => ({ currentValue: h.symbol === 'A' ? 50 : 50 });
        const { result } = renderHook(() => useRiskAnalytics(pf, calc), { wrapper: wrap() });
        await waitFor(() => expect(result.current.weights.length).toBe(2), { timeout: 4000 });
        const tot = result.current.weights.reduce((s, x) => s + x.w, 0);
        expect(tot).toBeCloseTo(1, 5);
    });

    it('enabled=false → query çalışmaz', () => {
        renderHook(() => useRiskAnalytics([{ symbol: 'X', assetType: 'STOCK', quantity: 1 }], () => ({}), false), {
            wrapper: wrap()
        });
        expect(historyMock.getData).not.toHaveBeenCalled();
    });
});
