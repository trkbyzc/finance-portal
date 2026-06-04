import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import usePortfolioTabs from './usePortfolioTabs';

describe('usePortfolioTabs', () => {
    it('null portfolio → tabs=[ALL], counts ALL=0', () => {
        const { result } = renderHook(() => usePortfolioTabs(null));
        expect(result.current.activeTab).toBe('ALL');
        expect(result.current.tabsState.tabs).toEqual(['ALL']);
        expect(result.current.tabsState.counts.ALL).toBe(0);
        expect(result.current.filteredPortfolio).toEqual([]);
    });

    it('STOCK+CRYPTO içeren portfolio → tabs=[ALL, STOCK, CRYPTO]', () => {
        const pf = [
            { symbol: 'THYAO', assetType: 'STOCK' },
            { symbol: 'GARAN', assetType: 'STOCK' },
            { symbol: 'BTC', assetType: 'CRYPTO' },
        ];
        const { result } = renderHook(() => usePortfolioTabs(pf));
        expect(result.current.tabsState.tabs).toEqual(['ALL', 'STOCK', 'CRYPTO']);
        expect(result.current.tabsState.counts.STOCK).toBe(2);
        expect(result.current.tabsState.counts.CRYPTO).toBe(1);
        expect(result.current.tabsState.counts.ALL).toBe(3);
    });

    it('setActiveTab → filteredPortfolio sadece o type', () => {
        const pf = [
            { symbol: 'X', assetType: 'STOCK' },
            { symbol: 'Y', assetType: 'CRYPTO' },
        ];
        const { result } = renderHook(() => usePortfolioTabs(pf));
        act(() => result.current.setActiveTab('CRYPTO'));
        expect(result.current.filteredPortfolio).toEqual([{ symbol: 'Y', assetType: 'CRYPTO' }]);
    });

    it('active tab boşalırsa otomatik ALL\'a döner', () => {
        const pf = [{ symbol: 'X', assetType: 'STOCK' }];
        const { result, rerender } = renderHook((p) => usePortfolioTabs(p), { initialProps: pf });
        act(() => result.current.setActiveTab('STOCK'));
        expect(result.current.activeTab).toBe('STOCK');
        rerender([]);
        expect(result.current.activeTab).toBe('ALL');
    });

    it('tab order: STOCK, CRYPTO, CURRENCY, COMMODITY, BOND, FUND, FUTURE', () => {
        const pf = [
            { assetType: 'FUTURE' },
            { assetType: 'STOCK' },
            { assetType: 'CRYPTO' },
            { assetType: 'BOND' },
        ];
        const { result } = renderHook(() => usePortfolioTabs(pf));
        expect(result.current.tabsState.tabs).toEqual(['ALL', 'STOCK', 'CRYPTO', 'BOND', 'FUTURE']);
    });

    it('ALL filteredPortfolio = tüm portfolio', () => {
        const pf = [
            { symbol: 'X', assetType: 'STOCK' },
            { symbol: 'Y', assetType: 'CRYPTO' },
        ];
        const { result } = renderHook(() => usePortfolioTabs(pf));
        expect(result.current.filteredPortfolio).toEqual(pf);
    });

    it('bilinmeyen assetType → counts\'ta sayılmaz', () => {
        const pf = [{ symbol: 'X', assetType: 'XYZ' }];
        const { result } = renderHook(() => usePortfolioTabs(pf));
        expect(result.current.tabsState.tabs).toEqual(['ALL']);
        expect(result.current.tabsState.counts.ALL).toBe(1);
    });
});
