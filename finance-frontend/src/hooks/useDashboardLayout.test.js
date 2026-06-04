import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardLayout } from './useDashboardLayout';

const ALL = ['a', 'b', 'c', 'd'];

describe('useDashboardLayout', () => {
    beforeEach(() => localStorage.clear());

    it('ilk yükleme: enabledKeys = allKeys, availableKeys boş', () => {
        const { result } = renderHook(() => useDashboardLayout(ALL));
        expect(result.current.enabledKeys).toEqual(ALL);
        expect(result.current.availableKeys).toEqual([]);
    });

    it('remove → availableKeys\'e taşınır', () => {
        const { result } = renderHook(() => useDashboardLayout(ALL));
        act(() => result.current.remove('b'));
        expect(result.current.enabledKeys).toEqual(['a', 'c', 'd']);
        expect(result.current.availableKeys).toEqual(['b']);
    });

    it('aynı key 2 kere remove edilirse idempotent', () => {
        const { result } = renderHook(() => useDashboardLayout(ALL));
        act(() => result.current.remove('b'));
        act(() => result.current.remove('b'));
        expect(result.current.availableKeys).toEqual(['b']);
    });

    it('add → enabledKeys sonuna eklenir', () => {
        const { result } = renderHook(() => useDashboardLayout(ALL));
        act(() => result.current.remove('a'));
        act(() => result.current.add('a'));
        expect(result.current.enabledKeys).toContain('a');
        expect(result.current.availableKeys).not.toContain('a');
    });

    it('reorder → dragKey targetKey önüne taşınır', () => {
        const { result } = renderHook(() => useDashboardLayout(ALL));
        act(() => result.current.reorder('d', 'b'));
        // d, b'nin önüne gelir
        expect(result.current.enabledKeys.indexOf('d'))
            .toBeLessThan(result.current.enabledKeys.indexOf('b'));
    });

    it('reorder aynı key → noop', () => {
        const { result } = renderHook(() => useDashboardLayout(ALL));
        act(() => result.current.reorder('a', 'a'));
        expect(result.current.enabledKeys).toEqual(ALL);
    });

    it('reorder olmayan key → noop', () => {
        const { result } = renderHook(() => useDashboardLayout(ALL));
        act(() => result.current.reorder('XX', 'a'));
        expect(result.current.enabledKeys).toEqual(ALL);
    });

    it('reset → varsayılan sıraya döner', () => {
        const { result } = renderHook(() => useDashboardLayout(ALL));
        act(() => result.current.remove('a'));
        act(() => result.current.reset());
        expect(result.current.enabledKeys).toEqual(ALL);
        expect(result.current.availableKeys).toEqual([]);
    });

    it("localStorage'a kalıcılaştırır + reload ile geri okur", () => {
        const { result, unmount } = renderHook(() => useDashboardLayout(ALL));
        act(() => result.current.remove('a'));
        unmount();

        const { result: r2 } = renderHook(() => useDashboardLayout(ALL));
        expect(r2.current.availableKeys).toContain('a');
    });

    it("yeni eklenen kod-tarafı key otomatik sıraya gelir", () => {
        // Storage'da eski layout (e olmadan)
        localStorage.setItem('dashboard:layout:v1', JSON.stringify({ order: ['a', 'b'], disabled: [] }));
        const { result } = renderHook(() => useDashboardLayout(['a', 'b', 'e']));
        expect(result.current.enabledKeys).toContain('e');
    });

    it('storage corrupted → varsayılanlara döner', () => {
        localStorage.setItem('dashboard:layout:v1', 'not-json');
        const { result } = renderHook(() => useDashboardLayout(ALL));
        expect(result.current.enabledKeys).toEqual(ALL);
    });

    it("kaldırılmış (allKeys'de olmayan) disabled key'i filtreler", () => {
        localStorage.setItem('dashboard:layout:v1',
            JSON.stringify({ order: ALL, disabled: ['removed-key', 'a'] }));
        const { result } = renderHook(() => useDashboardLayout(ALL));
        // 'removed-key' artık ALL'da değil, disabled listesinden temizlenir
        expect(result.current.availableKeys).toEqual(['a']);
    });
});
