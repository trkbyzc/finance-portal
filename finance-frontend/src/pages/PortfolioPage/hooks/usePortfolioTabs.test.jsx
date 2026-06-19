import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import usePortfolioTabs from './usePortfolioTabs';

describe('usePortfolioTabs (doğa-bazlı)', () => {
    it('null portfolio → tabs=[ALL], counts ALL=0', () => {
        const { result } = renderHook(() => usePortfolioTabs(null));
        expect(result.current.activeTab).toBe('ALL');
        expect(result.current.tabsState.tabs).toEqual(['ALL']);
        expect(result.current.tabsState.counts.ALL).toBe(0);
        expect(result.current.filteredPortfolio).toEqual([]);
    });

    it('STOCK+CRYPTO → ikisi de SPOT → tabs=[ALL, SPOT]', () => {
        const pf = [
            { symbol: 'THYAO', assetType: 'STOCK' },
            { symbol: 'GARAN', assetType: 'STOCK' },
            { symbol: 'BTC', assetType: 'CRYPTO' },
        ];
        const { result } = renderHook(() => usePortfolioTabs(pf));
        expect(result.current.tabsState.tabs).toEqual(['ALL', 'SPOT']);
        expect(result.current.tabsState.counts.SPOT).toBe(3);
        expect(result.current.tabsState.counts.ALL).toBe(3);
    });

    it('BOND→FIXED, FUTURE→DERIV doğaları', () => {
        const pf = [
            { symbol: 'TP.X', assetType: 'BOND' },
            { symbol: 'F_X', assetType: 'FUTURE' },
        ];
        const { result } = renderHook(() => usePortfolioTabs(pf));
        expect(result.current.tabsState.counts.FIXED).toBe(1);
        expect(result.current.tabsState.counts.DERIV).toBe(1);
    });

    it('setActiveTab(FIXED) → filteredPortfolio sadece tahviller', () => {
        const pf = [
            { symbol: 'X', assetType: 'STOCK' },
            { symbol: 'TP.Y', assetType: 'BOND' },
        ];
        const { result } = renderHook(() => usePortfolioTabs(pf));
        act(() => result.current.setActiveTab('FIXED'));
        expect(result.current.filteredPortfolio).toEqual([{ symbol: 'TP.Y', assetType: 'BOND' }]);
    });

    it('aktif doğa boşalırsa otomatik ALL\'a döner', () => {
        const pf = [{ symbol: 'X', assetType: 'STOCK' }];
        const { result, rerender } = renderHook((p) => usePortfolioTabs(p), { initialProps: pf });
        act(() => result.current.setActiveTab('SPOT'));
        expect(result.current.activeTab).toBe('SPOT');
        rerender([]);
        expect(result.current.activeTab).toBe('ALL');
    });

    it('doğa sırası: SPOT, FIXED, DERIV', () => {
        const pf = [
            { assetType: 'FUTURE' },
            { assetType: 'STOCK' },
            { assetType: 'BOND' },
        ];
        const { result } = renderHook(() => usePortfolioTabs(pf));
        expect(result.current.tabsState.tabs).toEqual(['ALL', 'SPOT', 'FIXED', 'DERIV']);
    });

    it('ALL filteredPortfolio = tüm portfolio', () => {
        const pf = [
            { symbol: 'X', assetType: 'STOCK' },
            { symbol: 'TP.Y', assetType: 'BOND' },
        ];
        const { result } = renderHook(() => usePortfolioTabs(pf));
        expect(result.current.filteredPortfolio).toEqual(pf);
    });

    it('bilinmeyen assetType → SPOT (varsayılan)', () => {
        const pf = [{ symbol: 'X', assetType: 'XYZ' }];
        const { result } = renderHook(() => usePortfolioTabs(pf));
        expect(result.current.tabsState.tabs).toEqual(['ALL', 'SPOT']);
        expect(result.current.tabsState.counts.SPOT).toBe(1);
    });
});
