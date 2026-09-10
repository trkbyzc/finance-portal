import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { apiMock, currencyMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn() },
    currencyMock: { usdRate: 30 },
}));

vi.mock('../../../config/apiClient', () => ({ apiClient: apiMock }));
vi.mock('../../../context/CurrencyContext', () => ({
    useCurrency: () => currencyMock,
}));
vi.mock('../../../utils/currencyConversion', () => ({
    nativeCurrencyForType: (t) => (t === 'CRYPTO' || t === 'CURRENCY' ? 'USD' : 'TRY'),
}));

import usePortfolioPricing from './usePortfolioPricing';

const wrap = () => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }) => <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

beforeEach(() => {
    apiMock.get.mockReset();
});

const setupMarket = (data = {}) => {
    apiMock.get.mockImplementation((url) => {
        if (url === '/market-data/stocks') return Promise.resolve(data.stocks || []);
        if (url === '/market-data/crypto-currencies') return Promise.resolve(data.cryptos || []);
        if (url === '/market-data/currencies') return Promise.resolve(data.currencies || []);
        if (url === '/market-data/commodities') return Promise.resolve(data.commodities || []);
        if (url === '/market-data/bonds') return Promise.resolve(data.bonds || []);
        if (url === '/market-data/tr-funds') return Promise.resolve(data.funds || []);
        if (url === '/market-data/viop') return Promise.resolve(data.viop || []);
        if (url === '/market-data/historical') return Promise.resolve(data.historical || []);
        return Promise.resolve([]);
    });
};

describe('usePortfolioPricing', () => {
    it('marketData null → getCurrentPrice null', () => {
        apiMock.get.mockImplementation(() => new Promise(() => {}));
        const { result } = renderHook(() => usePortfolioPricing([]), { wrapper: wrap() });
        expect(result.current.getCurrentPrice('X', 'STOCK')).toBeNull();
    });

    it('STOCK fiyat lookup', async () => {
        setupMarket({ stocks: [{ symbol: 'THYAO', price: 250 }] });
        const { result } = renderHook(() => usePortfolioPricing([]), { wrapper: wrap() });
        await waitFor(() => expect(result.current.getCurrentPrice('THYAO', 'STOCK')).toBe(250));
    });

    it('CRYPTO → forexSelling', async () => {
        setupMarket({ cryptos: [{ currencyCode: 'BTC', forexSelling: 60000 }] });
        const { result } = renderHook(() => usePortfolioPricing([]), { wrapper: wrap() });
        await waitFor(() => expect(result.current.getCurrentPrice('BTC', 'CRYPTO')).toBe(60000));
    });

    it('CURRENCY → forexSelling', async () => {
        setupMarket({ currencies: [{ currencyCode: 'EUR', forexSelling: 33 }] });
        const { result } = renderHook(() => usePortfolioPricing([]), { wrapper: wrap() });
        await waitFor(() => expect(result.current.getCurrentPrice('EUR', 'CURRENCY')).toBe(33));
    });

    it('bilinmeyen assetType → null (default branch)', async () => {
        setupMarket({});
        const { result } = renderHook(() => usePortfolioPricing([]), { wrapper: wrap() });
        await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
        expect(result.current.getCurrentPrice('X', 'UNKNOWN')).toBeNull();
    });

    it('BOND fiyat lookup', async () => {
        setupMarket({ bonds: [{ symbol: 'GVDA', price: 90.5 }] });
        const { result } = renderHook(() => usePortfolioPricing([]), { wrapper: wrap() });
        await waitFor(() => expect(result.current.getCurrentPrice('GVDA', 'BOND')).toBe(90.5));
    });

    it('COMMODITY fiyat lookup', async () => {
        setupMarket({ commodities: [{ symbol: 'GAU', price: 2500 }] });
        const { result } = renderHook(() => usePortfolioPricing([]), { wrapper: wrap() });
        await waitFor(() => expect(result.current.getCurrentPrice('GAU', 'COMMODITY')).toBe(2500));
    });

    it('FUTURE → viop lookup', async () => {
        setupMarket({ viop: [{ symbol: 'F_XU030', price: 11000 }] });
        const { result } = renderHook(() => usePortfolioPricing([]), { wrapper: wrap() });
        await waitFor(() => expect(result.current.getCurrentPrice('F_XU030', 'FUTURE')).toBe(11000));
    });

    it('getDailyChange STOCK changePercent', async () => {
        setupMarket({ stocks: [{ symbol: 'X', changePercent: 2.5 }] });
        const { result } = renderHook(() => usePortfolioPricing([]), { wrapper: wrap() });
        await waitFor(() => expect(result.current.getDailyChange('X', 'STOCK')).toBe(2.5));
    });

    it('getDailyChange bilinmeyen type → null', async () => {
        setupMarket({});
        const { result } = renderHook(() => usePortfolioPricing([]), { wrapper: wrap() });
        await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
        expect(result.current.getDailyChange('X', 'WTH')).toBeNull();
    });

    it('calculateProfitLoss TR stock — TRY native rate=1', async () => {
        setupMarket({ stocks: [{ symbol: 'X', price: 110 }] });
        const { result } = renderHook(() => usePortfolioPricing([]), { wrapper: wrap() });
        await waitFor(() => expect(result.current.getCurrentPrice('X', 'STOCK')).toBe(110));

        const pl = result.current.calculateProfitLoss({
            symbol: 'X', assetType: 'STOCK', quantity: 10, averagePrice: 100, contractSize: 1,
        });
        expect(pl.currentValue).toBe(1100);
        expect(pl.costValue).toBe(1000);
        expect(pl.profitLoss).toBe(100);
        expect(pl.profitLossPercent).toBe(10);
    });

    it('calculateProfitLoss CRYPTO — USD * usdRate=30', async () => {
        setupMarket({ cryptos: [{ currencyCode: 'BTC', forexSelling: 100 }] });
        const { result } = renderHook(() => usePortfolioPricing([]), { wrapper: wrap() });
        await waitFor(() => expect(result.current.getCurrentPrice('BTC', 'CRYPTO')).toBe(100));

        const pl = result.current.calculateProfitLoss({
            symbol: 'BTC', assetType: 'CRYPTO', quantity: 2, averagePrice: 90,
        });
        // 100 USD * 30 TRY * 2 = 6000
        expect(pl.currentValue).toBe(6000);
        // 90 USD * 30 TRY * 2 = 5400
        expect(pl.costValue).toBe(5400);
        expect(pl.profitLoss).toBe(600);
    });

    it('calculateProfitLoss averagePrice=0 → percent 0', async () => {
        setupMarket({ stocks: [{ symbol: 'X', price: 100 }] });
        const { result } = renderHook(() => usePortfolioPricing([]), { wrapper: wrap() });
        await waitFor(() => expect(result.current.getCurrentPrice('X', 'STOCK')).toBe(100));
        const pl = result.current.calculateProfitLoss({
            symbol: 'X', assetType: 'STOCK', quantity: 1, averagePrice: 0,
        });
        expect(pl.profitLossPercent).toBe(0);
    });

    it('FUND fundPrices map - portfolio FUND içeriyor → historical çağrısı', async () => {
        setupMarket({
            funds: [],
            historical: [{ date: '2026-01-01', price: 1.5 }],
        });
        const pf = [{ symbol: 'FNDX', assetType: 'FUND', quantity: 100, averagePrice: 1 }];
        const { result } = renderHook(() => usePortfolioPricing(pf), { wrapper: wrap() });
        await waitFor(() => expect(apiMock.get).toHaveBeenCalledWith('/market-data/historical', expect.anything()));
        await waitFor(() => expect(result.current.getCurrentPrice('FNDX', 'FUND')).toBe(1.5));
    });
});
