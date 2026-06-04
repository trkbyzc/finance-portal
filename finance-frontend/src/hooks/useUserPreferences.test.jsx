import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { authState } = vi.hoisted(() => ({ authState: { isAuthenticated: true } }));
vi.mock('../context/AuthContext', () => ({
    useAuth: () => authState,
}));

const { prefsApi } = vi.hoisted(() => ({
    prefsApi: { getMyPreferences: vi.fn() }
}));
vi.mock('../services/api/preferencesApi', () => ({
    preferencesApi: prefsApi,
}));

import useUserPreferences from './useUserPreferences';

const makeWrap = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useUserPreferences', () => {
    beforeEach(() => {
        authState.isAuthenticated = true;
        prefsApi.getMyPreferences.mockReset();
    });

    it("isAuthenticated=true → getMyPreferences çağrılır", async () => {
        prefsApi.getMyPreferences.mockResolvedValue({
            tickers: [{ symbol: 'BTC' }], tickerScope: 'HOME_ONLY'
        });
        const { result } = renderHook(() => useUserPreferences(), { wrapper: makeWrap() });

        await waitFor(() => {
            expect(result.current.preferences?.tickerScope).toBe('HOME_ONLY');
        });
        expect(prefsApi.getMyPreferences).toHaveBeenCalled();
    });

    it("isAuthenticated=false → query disabled, data undefined", () => {
        authState.isAuthenticated = false;
        const { result } = renderHook(() => useUserPreferences(), { wrapper: makeWrap() });
        expect(result.current.preferences).toBeUndefined();
        expect(prefsApi.getMyPreferences).not.toHaveBeenCalled();
    });

    it("refetch fonksiyonu döner", () => {
        prefsApi.getMyPreferences.mockResolvedValue({});
        const { result } = renderHook(() => useUserPreferences(), { wrapper: makeWrap() });
        expect(typeof result.current.refetch).toBe('function');
    });

    it("isAuthenticated=false iken isLoading false", () => {
        authState.isAuthenticated = false;
        const { result } = renderHook(() => useUserPreferences(), { wrapper: makeWrap() });
        expect(result.current.isLoading).toBe(false);
    });
});
