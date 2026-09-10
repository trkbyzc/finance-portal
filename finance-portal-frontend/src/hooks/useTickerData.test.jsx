import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { aggregateMock } = vi.hoisted(() => ({ aggregateMock: { getAllMarkets: vi.fn() } }));
vi.mock('../services/api', () => ({ aggregateApi: aggregateMock }));

const { prefsRef } = vi.hoisted(() => ({ prefsRef: { current: null } }));
vi.mock('./useUserPreferences', () => ({
    default: () => ({ preferences: prefsRef.current, isLoading: false, refetch: vi.fn() }),
}));

import { useTickerData } from './useTickerData';

const makeWrap = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useTickerData', () => {
    beforeEach(() => {
        aggregateMock.getAllMarkets.mockReset();
        prefsRef.current = null;
    });

    it("preferences yok → default 5 majör (USD, EUR, GAU, XU100, BTC)", async () => {
        aggregateMock.getAllMarkets.mockResolvedValue({
            currencies: [
                { currencyCode: 'USD', forexSelling: 30 },
                { currencyCode: 'EUR', forexSelling: 33 },
            ],
            cryptos: [{ currencyCode: 'BTC', forexSelling: 60000 }],
            commodities: [{ symbol: 'GAU', name: 'Gram Altın' }],
            indices: [{ symbol: 'XU100', name: 'BIST 100' }],
        });

        const { result } = renderHook(() => useTickerData(), { wrapper: makeWrap() });
        await waitFor(() => expect(result.current.tickerData.length).toBe(5));

        const symbols = result.current.tickerData.map(t => t._symbol);
        expect(symbols).toContain('USD');
        expect(symbols).toContain('EUR');
        expect(symbols).toContain('BTC');
    });

    it("preferences custom list → onları kullanır", async () => {
        prefsRef.current = {
            tickers: [
                { symbol: 'THYAO.IS', assetType: 'STOCK' },
                { symbol: 'BTC', assetType: 'CRYPTO' },
            ],
        };
        aggregateMock.getAllMarkets.mockResolvedValue({
            stocks: [{ symbol: 'THYAO.IS', price: 39 }],
            cryptos: [{ currencyCode: 'BTC', forexSelling: 60000 }],
        });

        const { result } = renderHook(() => useTickerData(), { wrapper: makeWrap() });
        await waitFor(() => expect(result.current.tickerData.length).toBe(2));
        expect(result.current.tickerData[0]._symbol).toBe('THYAO.IS');
    });

    it("preferences var ama eşleşme yok → boş array", async () => {
        prefsRef.current = {
            tickers: [{ symbol: 'OLMAYAN.IS', assetType: 'STOCK' }],
        };
        aggregateMock.getAllMarkets.mockResolvedValue({ stocks: [] });

        const { result } = renderHook(() => useTickerData(), { wrapper: makeWrap() });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.tickerData).toEqual([]);
    });

    it("allMarkets null → boş array", () => {
        prefsRef.current = null;
        aggregateMock.getAllMarkets.mockResolvedValue(null);
        const { result } = renderHook(() => useTickerData(), { wrapper: makeWrap() });
        expect(result.current.tickerData).toEqual([]);
    });

    it("preferences boş tickers list → default fallback", async () => {
        prefsRef.current = { tickers: [] };
        aggregateMock.getAllMarkets.mockResolvedValue({
            currencies: [{ currencyCode: 'USD', forexSelling: 30 }],
        });

        const { result } = renderHook(() => useTickerData(), { wrapper: makeWrap() });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        // Default fallback denenir, USD bulunur
        expect(result.current.tickerData.find(t => t._symbol === 'USD')).toBeTruthy();
    });

    it("kategori inference: tagForChart pattern + poolCategory fallback", async () => {
        prefsRef.current = {
            tickers: [{ symbol: 'GAU', assetType: 'COMMODITY' }],
        };
        aggregateMock.getAllMarkets.mockResolvedValue({
            commodities: [{ symbol: 'GAU' }],
        });

        const { result } = renderHook(() => useTickerData(), { wrapper: makeWrap() });
        await waitFor(() => expect(result.current.tickerData).toHaveLength(1));
        expect(result.current.tickerData[0]._category).toBe('COMMODITY');
    });
});
