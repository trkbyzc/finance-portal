import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { aggregateMock } = vi.hoisted(() => ({
    aggregateMock: { getAllMarkets: vi.fn(), getMarketsByEndpoint: vi.fn() },
}));
vi.mock('../services/api', () => ({ aggregateApi: aggregateMock }));

import { useMarketData } from './useMarketData';

const wrap = () => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }) => <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

beforeEach(() => {
    aggregateMock.getAllMarkets.mockReset();
    aggregateMock.getMarketsByEndpoint.mockReset();
});

describe('useMarketData', () => {
    it('crypto kategorisi → endpoint /crypto-currencies', async () => {
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([{ currencyCode: 'BTC' }]);
        const { result } = renderHook(() => useMarketData('crypto'), { wrapper: wrap() });
        await waitFor(() => expect(aggregateMock.getMarketsByEndpoint).toHaveBeenCalledWith('/crypto-currencies'));
        expect(result.current.config.title).toBe('Kripto Paralar');
    });

    it('tr-stocks → sadece .IS endingli', async () => {
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([
            { symbol: 'THYAO.IS' }, { symbol: 'AAPL' }, { yahooSymbol: 'GARAN.IS', symbol: 'GARAN' },
        ]);
        const { result } = renderHook(() => useMarketData('tr-stocks'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.data.length).toBe(2));
    });

    it('us-stocks → .IS DEĞİL endingli', async () => {
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([
            { symbol: 'THYAO.IS' }, { symbol: 'AAPL' }, { symbol: 'GOOGL' },
        ]);
        const { result } = renderHook(() => useMarketData('us-stocks'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.data.length).toBe(2));
    });

    it('live → aggregate.getAllMarkets, sectionları birleştirir', async () => {
        aggregateMock.getAllMarkets.mockResolvedValue({
            indices: [{ symbol: 'XU100' }],
            stocks: [{ symbol: 'A' }, { symbol: 'B' }],
            cryptos: [{ symbol: 'BTC' }],
        });
        const { result } = renderHook(() => useMarketData('live'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.data.length).toBe(4));
    });

    it('eurobonds → assetCategory=EUROBOND', async () => {
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([{ symbol: 'TR2030' }]);
        const { result } = renderHook(() => useMarketData('eurobonds'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.data[0].assetCategory).toBe('EUROBOND'));
        expect(result.current.data[0].chartType).toBe('LINE');
    });

    it('tr-funds → assetCategory=FUND', async () => {
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([{ symbol: 'X' }]);
        const { result } = renderHook(() => useMarketData('tr-funds'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.data[0].assetCategory).toBe('FUND'));
    });

    it('bonds → assetCategory=BOND', async () => {
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([{ symbol: 'GVDA' }]);
        const { result } = renderHook(() => useMarketData('bonds'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.data[0].assetCategory).toBe('BOND'));
    });

    it('searchTerm filtreleme — case-insensitive', async () => {
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([
            { symbol: 'BTC', name: 'Bitcoin' }, { symbol: 'ETH', name: 'Ether' },
        ]);
        const { result } = renderHook(() => useMarketData('crypto'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.data.length).toBe(2));
        act(() => result.current.setSearchTerm('bitc'));
        await waitFor(() => expect(result.current.data.length).toBe(1));
        expect(result.current.data[0].symbol).toBe('BTC');
    });

    it('ilk render → ilk item selectedAsset olur', async () => {
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([{ symbol: 'X' }, { symbol: 'Y' }]);
        const { result } = renderHook(() => useMarketData('crypto'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.selectedAsset?.symbol).toBe('X'));
    });

    it('showcaseAssets crypto → slice(0,10)', async () => {
        const arr = Array.from({ length: 15 }, (_, i) => ({ symbol: `C${i}` }));
        aggregateMock.getMarketsByEndpoint.mockResolvedValue(arr);
        const { result } = renderHook(() => useMarketData('crypto'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.showcaseAssets.length).toBe(10));
    });

    it('showcaseAssets currencies → majors filter slice(0,5)', async () => {
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([
            { currencyCode: 'USD' }, { currencyCode: 'EUR' },
            { currencyCode: 'JPY' }, { currencyCode: 'CAD' },
        ]);
        const { result } = renderHook(() => useMarketData('currencies'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.showcaseAssets.length).toBe(3));
    });

    it('hata fırlatırsa → boş array fallback', async () => {
        aggregateMock.getMarketsByEndpoint.mockRejectedValue(new Error('boom'));
        const { result } = renderHook(() => useMarketData('crypto'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toEqual([]);
    });

    it('futures kategori config title', () => {
        aggregateMock.getMarketsByEndpoint.mockResolvedValue([]);
        const { result } = renderHook(() => useMarketData('futures'), { wrapper: wrap() });
        expect(result.current.config.title).toBe('Küresel Vadeliler');
    });
});
