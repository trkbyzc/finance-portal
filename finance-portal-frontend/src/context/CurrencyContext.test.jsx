import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// currencyApi mock — USD rate 30 döner
vi.mock('../services/api', () => ({
    currencyApi: {
        getAllCurrencies: vi.fn().mockResolvedValue([
            { currencyCode: 'USD', forexSelling: 30 },
            { currencyCode: 'EUR', forexSelling: 33 },
        ]),
    },
}));

import { CurrencyProvider, useCurrency } from './CurrencyContext';

const makeWrap = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }) => (
        <QueryClientProvider client={client}>
            <CurrencyProvider>{children}</CurrencyProvider>
        </QueryClientProvider>
    );
};

describe('CurrencyProvider + useCurrency', () => {
    let wrap;
    beforeEach(() => { wrap = makeWrap(); });

    it('default currency TRY', () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        expect(result.current.currency).toBe('TRY');
    });

    it('setCurrency manual değiştirir', () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        act(() => result.current.setCurrency('USD'));
        expect(result.current.currency).toBe('USD');
    });

    it('toggleCurrency TRY ↔ USD', () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        act(() => result.current.toggleCurrency());
        expect(result.current.currency).toBe('USD');
        act(() => result.current.toggleCurrency());
        expect(result.current.currency).toBe('TRY');
    });

    it('convertPrice aynı para birimi → değişmez', () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        expect(result.current.convertPrice(100, 'TRY')).toBe(100);
    });

    it('convertPrice null/0 fiyat → 0', () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        expect(result.current.convertPrice(null, 'TRY')).toBe(0);
        expect(result.current.convertPrice(0, 'TRY')).toBe(0);
    });

    it('convertPrice USD native + TRY toggle → × usdRate', async () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        await waitFor(() => expect(result.current.usdRate).toBe(30));
        // currency=TRY default, native=USD → 100$ × 30 = 3000₺
        expect(result.current.convertPrice(100, 'USD')).toBe(3000);
    });

    it('convertPrice TRY native + USD toggle → / usdRate', async () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        await waitFor(() => expect(result.current.usdRate).toBe(30));
        act(() => result.current.setCurrency('USD'));
        // currency=USD, native=TRY → 3000₺ / 30 = 100$
        expect(result.current.convertPrice(3000, 'TRY')).toBe(100);
    });

    it('formatPrice null/undefined → "-"', () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        expect(result.current.formatPrice(null)).toBe('-');
        expect(result.current.formatPrice(undefined)).toBe('-');
    });

    it('formatPrice sayı → currency suffix ile', () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        const out = result.current.formatPrice(100);
        expect(out).toMatch(/₺|TRY|TL/);
    });

    it('toNative aynı birim → input', () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        expect(result.current.toNative(100, 'TRY')).toBe(100);
    });

    it('toNative USD currency, native TRY → input * rate', async () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        await waitFor(() => expect(result.current.usdRate).toBe(30));
        act(() => result.current.setCurrency('USD'));
        // Display 100$ → native TRY → 100 * 30 = 3000
        expect(result.current.toNative(100, 'TRY')).toBe(3000);
    });

    it('toNative invalid input → 0', () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        expect(result.current.toNative('abc', 'TRY')).toBe(0);
    });

    it('formatNative native birimde format', () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        const out = result.current.formatNative(100, 'USD');
        expect(out).toMatch(/\$|USD/);
    });

    it('formatNative null → "-"', () => {
        const { result } = renderHook(() => useCurrency(), { wrapper: wrap });
        expect(result.current.formatNative(null)).toBe('-');
    });
});
