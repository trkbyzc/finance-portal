import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const { api } = vi.hoisted(() => ({
    api: {
        bondFundApi: { getTrBonds: vi.fn(), getTrBondsCatalog: vi.fn() },
        aggregateApi: { getAllMarkets: vi.fn() },
    },
}));
vi.mock('../services/api', () => api);

vi.mock('../utils/categoryUtils', () => ({
    detectCategoryFromSymbol: (s) => (s?.endsWith?.('.IS') ? 'STOCK' : null),
    marketsKeyForCategory: (cat) => {
        if (cat === 'STOCK') return ['stocks'];
        if (cat === 'CRYPTO') return ['cryptos'];
        if (cat === 'CURRENCY') return ['currencies'];
        return null;
    },
}));
vi.mock('../utils/currencyConversion', () => ({
    detectNativeCurrency: () => 'TRY',
    isYieldAsset: (a) => !!a.yield,
}));

import { useAssetDetails } from './useAssetDetails';

const wrap = (initialPath = '/x') => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }) => (
        <QueryClientProvider client={c}>
            <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
        </QueryClientProvider>
    );
};

beforeEach(() => {
    Object.values(api).forEach(grp =>
        Object.values(grp).forEach(fn => fn.mockReset())
    );
});

describe('useAssetDetails', () => {
    it('symbol yok → asset null + decodedSymbol ""', () => {
        const { result } = renderHook(() => useAssetDetails(''), { wrapper: wrap() });
        expect(result.current.decodedSymbol).toBe('');
        expect(result.current.asset).toBeNull();
    });

    it('TR_BOND (TP.XXX) → bonds endpoint çağrılır', async () => {
        api.bondFundApi.getTrBonds.mockResolvedValue([
            { SERI_NO: 'TP.TRT030626K26', yield: 35 }
        ]);
        api.bondFundApi.getTrBondsCatalog.mockResolvedValue([]);
        const { result } = renderHook(() => useAssetDetails('TP.TRT030626K26'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.isTrBond).toBe(true));
        await waitFor(() => expect(result.current.asset?.assetCategory).toBe('BOND'));
        expect(result.current.asset.chartType).toBe('LINE');
    });

    it('TR_BOND found olmayan → parseTrBondName ile DİBS adı', async () => {
        api.bondFundApi.getTrBonds.mockResolvedValue([]);
        api.bondFundApi.getTrBondsCatalog.mockResolvedValue([]);
        const { result } = renderHook(() => useAssetDetails('TP.TRT030626K26'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.asset?.name).toBe('DİBS 03.06.2026'));
    });

    it('TR_BOND catalog match → ad ve yield katalogdan', async () => {
        api.bondFundApi.getTrBonds.mockResolvedValue([]);
        api.bondFundApi.getTrBondsCatalog.mockResolvedValue([
            { symbol: 'TP.TRT030626K26', name: 'Devlet İçin Bono X', yield: 42 }
        ]);
        const { result } = renderHook(() => useAssetDetails('TP.TRT030626K26'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.asset?.name).toBe('Devlet İçin Bono X'));
        expect(result.current.asset.yield).toBe(42);
    });

    it('STOCK pattern detection (.IS) → categories stocks', async () => {
        api.aggregateApi.getAllMarkets.mockResolvedValue({
            stocks: [{ symbol: 'THYAO.IS', price: 200 }],
        });
        const { result } = renderHook(() => useAssetDetails('THYAO.IS'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.asset?.symbol).toBe('THYAO.IS'));
        expect(result.current.asset.assetCategory).toBe('STOCK');
    });

    it('URL ?cat=CRYPTO → cryptos lookup', async () => {
        api.aggregateApi.getAllMarkets.mockResolvedValue({
            cryptos: [{ currencyCode: 'BTC', forexSelling: 60000 }],
        });
        const { result } = renderHook(() => useAssetDetails('BTC'), { wrapper: wrap('/x?cat=CRYPTO') });
        await waitFor(() => expect(result.current.asset?.assetCategory).toBe('CRYPTO'));
    });

    it('hiçbir markets içinde yoksa → fallback STOCK', async () => {
        api.aggregateApi.getAllMarkets.mockResolvedValue({});
        const { result } = renderHook(() => useAssetDetails('UNKNOWN'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.asset?.assetCategory).toBe('STOCK'));
    });

    it('VIOP detection — F_XU030', () => {
        api.aggregateApi.getAllMarkets.mockResolvedValue({});
        const { result } = renderHook(() => useAssetDetails('F_XU030'), { wrapper: wrap() });
        expect(result.current.isViop).toBe(true);
    });

    it('VIOP detection — VADE substring', () => {
        api.aggregateApi.getAllMarkets.mockResolvedValue({});
        const { result } = renderHook(() => useAssetDetails('XYZVADE'), { wrapper: wrap() });
        expect(result.current.isViop).toBe(true);
    });

    it('EUROBOND _EUROBOND suffix → isTrBond=false, isEurobond gerçek (asset.assetCategory)', async () => {
        api.aggregateApi.getAllMarkets.mockResolvedValue({});
        const { result } = renderHook(() => useAssetDetails('TR2030_EUROBOND'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.asset).toBeTruthy());
        expect(result.current.isTrBond).toBe(false);
    });

    it('isGlobalFund SPY → true', () => {
        api.aggregateApi.getAllMarkets.mockResolvedValue({});
        const { result } = renderHook(() => useAssetDetails('SPY'), { wrapper: wrap() });
        expect(result.current.isGlobalFund).toBe(true);
    });

    it('decodedSymbol decodeURIComponent', () => {
        api.aggregateApi.getAllMarkets.mockResolvedValue({});
        const { result } = renderHook(() => useAssetDetails('A%26B'), { wrapper: wrap() });
        expect(result.current.decodedSymbol).toBe('A&B');
    });

    it('asset.displayPrice number(rawPrice)', async () => {
        api.aggregateApi.getAllMarkets.mockResolvedValue({
            currencies: [{ currencyCode: 'USD', forexSelling: 32.5 }]
        });
        const { result } = renderHook(() => useAssetDetails('USD'), { wrapper: wrap('/x?cat=CURRENCY') });
        await waitFor(() => expect(result.current.asset?.displayPrice).toBe(32.5));
    });

    it('asset.isYieldBased — yield varlık', async () => {
        api.bondFundApi.getTrBonds.mockResolvedValue([{ SERI_NO: 'TP.TRT030626K26', yield: 35 }]);
        api.bondFundApi.getTrBondsCatalog.mockResolvedValue([]);
        const { result } = renderHook(() => useAssetDetails('TP.TRT030626K26'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.asset?.isYieldBased).toBe(true));
    });
});
