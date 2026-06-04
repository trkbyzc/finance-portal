import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { aggregateMock, currencyMock } = vi.hoisted(() => ({
    aggregateMock: { getMarketsByEndpoint: vi.fn(), getAllMarkets: vi.fn() },
    currencyMock: { getAllCurrencies: vi.fn() },
}));
vi.mock('../services/api', () => ({
    aggregateApi: aggregateMock,
    currencyApi: currencyMock,
}));

import { useDashboardData } from './useDashboardData';

const makeWrap = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useDashboardData', () => {
    beforeEach(() => {
        aggregateMock.getMarketsByEndpoint.mockReset();
        currencyMock.getAllCurrencies.mockReset();
    });

    it("default state: activeTab='stocks', calcAmount=1000, calcCurrency='USD'", () => {
        currencyMock.getAllCurrencies.mockResolvedValue([]);
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([]);
        const { result } = renderHook(() => useDashboardData(), { wrapper: makeWrap() });
        expect(result.current.activeTab).toBe('stocks');
        expect(result.current.calcAmount).toBe(1000);
        expect(result.current.calcCurrency).toBe('USD');
    });

    it("usdRate currencies'ten gelir (USD forexSelling)", async () => {
        currencyMock.getAllCurrencies.mockResolvedValue([
            { currencyCode: 'USD', forexSelling: 32 },
            { currencyCode: 'EUR', forexSelling: 35 },
        ]);
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([]);
        const { result } = renderHook(() => useDashboardData(), { wrapper: makeWrap() });
        await waitFor(() => expect(result.current.usdRate).toBe(32));
        expect(result.current.eurRate).toBe(35);
    });

    it("currencies null → rates 0", () => {
        currencyMock.getAllCurrencies.mockResolvedValue(null);
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([]);
        const { result } = renderHook(() => useDashboardData(), { wrapper: makeWrap() });
        expect(result.current.usdRate).toBe(0);
        expect(result.current.eurRate).toBe(0);
    });

    it("forexSelling yok → price fallback", async () => {
        currencyMock.getAllCurrencies.mockResolvedValue([
            { currencyCode: 'USD', price: 28 },
        ]);
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([]);
        const { result } = renderHook(() => useDashboardData(), { wrapper: makeWrap() });
        await waitFor(() => expect(result.current.usdRate).toBe(28));
    });

    it("setActiveTab değişir, tabData yeniden çekilir", async () => {
        currencyMock.getAllCurrencies.mockResolvedValue([]);
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([{ symbol: 'BTC' }]);

        const { result } = renderHook(() => useDashboardData(), { wrapper: makeWrap() });
        act(() => result.current.setActiveTab('crypto'));
        await waitFor(() => {
            expect(aggregateMock.getMarketsByEndpoint).toHaveBeenCalledWith('/crypto-currencies');
        });
    });

    it("calculatedResult = calcAmount * usdRate ile TR locale format", async () => {
        currencyMock.getAllCurrencies.mockResolvedValue([
            { currencyCode: 'USD', forexSelling: 32 },
        ]);
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([]);
        const { result } = renderHook(() => useDashboardData(), { wrapper: makeWrap() });
        await waitFor(() => expect(result.current.usdRate).toBe(32));
        // 1000 * 32 = 32000 → "32.000,00"
        expect(result.current.calculatedResult).toMatch(/32\.000,00/);
    });

    it("EUR seçince eurRate kullanılır", async () => {
        currencyMock.getAllCurrencies.mockResolvedValue([
            { currencyCode: 'USD', forexSelling: 32 },
            { currencyCode: 'EUR', forexSelling: 35 },
        ]);
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([]);
        const { result } = renderHook(() => useDashboardData(), { wrapper: makeWrap() });
        await waitFor(() => expect(result.current.eurRate).toBe(35));

        act(() => result.current.setCalcCurrency('EUR'));
        // 1000 * 35 = 35000 → "35.000,00"
        await waitFor(() => expect(result.current.calculatedResult).toMatch(/35\.000,00/));
    });

    it("tabData ilk 6 ile sınırlı (vitrin)", async () => {
        currencyMock.getAllCurrencies.mockResolvedValue([]);
        const big = Array.from({ length: 10 }, (_, i) => ({ symbol: `S${i}` }));
        aggregateMock.getMarketsByEndpoint.mockResolvedValue(big);

        const { result } = renderHook(() => useDashboardData(), { wrapper: makeWrap() });
        await waitFor(() => expect(result.current.tabData).toHaveLength(6));
    });
});
