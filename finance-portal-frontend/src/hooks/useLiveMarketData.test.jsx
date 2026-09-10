import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k }),
}));

const { apis } = vi.hoisted(() => ({
    apis: {
        indexApi: { getIndices: vi.fn() },
        stockApi: { getAllStocks: vi.fn() },
        commodityApi: { getAllCommodities: vi.fn(), getTurkishGold: vi.fn() },
        currencyApi: { getAllCurrencies: vi.fn() },
        bondFundApi: {
            getTrBonds: vi.fn(), getGlobalBonds: vi.fn(),
            getGlobalFunds: vi.fn(), getTrFunds: vi.fn(),
        },
        economyApi: {
            getHalkaArz: vi.fn(),
            getMacroEconomy: vi.fn(),
            getHistoricalEconomy: vi.fn(),
        },
    },
}));
vi.mock('../services/api', () => apis);

import { useLiveMarketData } from './useLiveMarketData';

const wrap = () => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }) => <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

beforeEach(() => {
    Object.values(apis).forEach(grp =>
        Object.values(grp).forEach(fn => fn.mockReset().mockResolvedValue([]))
    );
});

describe('useLiveMarketData', () => {
    it('default state — metric/range', () => {
        const { result } = renderHook(() => useLiveMarketData(), { wrapper: wrap() });
        expect(result.current.economyMetric).toBe('inflationRate');
        expect(result.current.economyRange).toBe('10y');
    });

    it('indices filter — yalnızca X... .IS', async () => {
        apis.indexApi.getIndices.mockResolvedValue([
            { symbol: 'XU100.IS' },
            { symbol: 'XU030.IS' },
            { symbol: '^GSPC' },
            { symbol: 'XAAPL.IS' },
        ]);
        const { result } = renderHook(() => useLiveMarketData(), { wrapper: wrap() });
        await waitFor(() => expect(result.current.indices.length).toBe(3));
    });

    it('turkishStocks → sadece .IS endingli', async () => {
        apis.stockApi.getAllStocks.mockResolvedValue([
            { symbol: 'THYAO.IS', price: 100, volume: 10, changePercent: 5 },
            { symbol: 'AAPL', price: 200 },
            { symbol: 'GARAN.IS', price: 50, volume: 20, changePercent: -3 },
        ]);
        const { result } = renderHook(() => useLiveMarketData(), { wrapper: wrap() });
        await waitFor(() => expect(result.current.turkishStocks.length).toBe(2));
    });

    it('topGainers — changePercent büyük olan ilk', async () => {
        apis.stockApi.getAllStocks.mockResolvedValue([
            { symbol: 'A.IS', changePercent: 1 },
            { symbol: 'B.IS', changePercent: 9 },
            { symbol: 'C.IS', changePercent: -5 },
        ]);
        const { result } = renderHook(() => useLiveMarketData(), { wrapper: wrap() });
        await waitFor(() => expect(result.current.topGainers[0].symbol).toBe('B.IS'));
    });

    it('topLosers — changePercent küçük olan ilk', async () => {
        apis.stockApi.getAllStocks.mockResolvedValue([
            { symbol: 'A.IS', changePercent: 1 },
            { symbol: 'B.IS', changePercent: 9 },
            { symbol: 'C.IS', changePercent: -5 },
        ]);
        const { result } = renderHook(() => useLiveMarketData(), { wrapper: wrap() });
        await waitFor(() => expect(result.current.topLosers[0].symbol).toBe('C.IS'));
    });

    it('highestVolume — TL hacme göre sıralı', async () => {
        apis.stockApi.getAllStocks.mockResolvedValue([
            { symbol: 'A.IS', price: 10, volume: 100 },
            { symbol: 'B.IS', price: 50, volume: 100 }, // TL volume 5000 > 1000
            { symbol: 'C.IS', price: 100, volume: 10 }, // 1000
        ]);
        const { result } = renderHook(() => useLiveMarketData(), { wrapper: wrap() });
        await waitFor(() => expect(result.current.highestVolume[0].symbol).toBe('B.IS'));
    });

    it('mostVolatile — |changePercent| büyük', async () => {
        apis.stockApi.getAllStocks.mockResolvedValue([
            { symbol: 'A.IS', changePercent: 1 },
            { symbol: 'B.IS', changePercent: -15 },
            { symbol: 'C.IS', changePercent: 2 },
        ]);
        const { result } = renderHook(() => useLiveMarketData(), { wrapper: wrap() });
        await waitFor(() => expect(result.current.mostVolatile[0].symbol).toBe('B.IS'));
    });

    it('commodityCards — GRAM_ALTIN + GC=F vs.', async () => {
        apis.commodityApi.getAllCommodities.mockResolvedValue([
            { symbol: 'GC=F' }, { symbol: 'SI=F' }, { symbol: 'CL=F' },
        ]);
        apis.commodityApi.getTurkishGold.mockResolvedValue([{ symbol: 'GRAM_ALTIN' }]);
        const { result } = renderHook(() => useLiveMarketData(), { wrapper: wrap() });
        await waitFor(() => expect(result.current.commodityCards.length).toBe(4));
    });

    it('sortedForexList — vipCodes order', async () => {
        apis.currencyApi.getAllCurrencies.mockResolvedValue([
            { currencyCode: 'EUR' }, { currencyCode: 'USD' }, { currencyCode: 'XYZ' },
        ]);
        const { result } = renderHook(() => useLiveMarketData(), { wrapper: wrap() });
        await waitFor(() => expect(result.current.sortedForexList.map(c => c.currencyCode)).toEqual(['USD', 'EUR']));
    });

    it('trBonds .value branch', async () => {
        apis.bondFundApi.getTrBonds.mockResolvedValue({ value: [{ symbol: 'X' }] });
        const { result } = renderHook(() => useLiveMarketData(), { wrapper: wrap() });
        await waitFor(() => expect(result.current.trBonds).toEqual([{ symbol: 'X' }]));
    });

    it('setEconomyMetric ve setEconomyRange çalışır', () => {
        const { result } = renderHook(() => useLiveMarketData(), { wrapper: wrap() });
        act(() => {
            result.current.setEconomyMetric('gdp');
            result.current.setEconomyRange('5y');
        });
        expect(result.current.economyMetric).toBe('gdp');
        expect(result.current.economyRange).toBe('5y');
    });
});
