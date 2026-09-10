import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

const wrap = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;

describe('ThemeProvider + useTheme', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    it("default tema 'dark'", () => {
        const { result } = renderHook(() => useTheme(), { wrapper: wrap });
        expect(result.current.theme).toBe('dark');
    });

    it('themes listesi (dark, light, hybrid)', () => {
        const { result } = renderHook(() => useTheme(), { wrapper: wrap });
        expect(result.current.themes).toEqual(['dark', 'light', 'hybrid']);
    });

    it("localStorage'a temayı kaydeder (useEffect)", () => {
        renderHook(() => useTheme(), { wrapper: wrap });
        expect(localStorage.getItem('finansportal-theme')).toBe('dark');
    });

    it("data-theme attribute html'e set olur", () => {
        renderHook(() => useTheme(), { wrapper: wrap });
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('localStorage geçerli değer varsa onu kullanır', () => {
        localStorage.setItem('finansportal-theme', 'light');
        const { result } = renderHook(() => useTheme(), { wrapper: wrap });
        expect(result.current.theme).toBe('light');
    });

    it('localStorage geçersiz değer → default', () => {
        localStorage.setItem('finansportal-theme', 'neon-pink');
        const { result } = renderHook(() => useTheme(), { wrapper: wrap });
        expect(result.current.theme).toBe('dark');
    });

    it('setTheme geçerli değer set eder', () => {
        const { result } = renderHook(() => useTheme(), { wrapper: wrap });
        act(() => result.current.setTheme('light'));
        expect(result.current.theme).toBe('light');
    });

    it('setTheme geçersiz değer → ignore', () => {
        const { result } = renderHook(() => useTheme(), { wrapper: wrap });
        act(() => result.current.setTheme('XXX'));
        expect(result.current.theme).toBe('dark');
    });

    it('cycleTheme döngü (dark → light → hybrid → dark)', () => {
        const { result } = renderHook(() => useTheme(), { wrapper: wrap });
        expect(result.current.theme).toBe('dark');
        act(() => result.current.cycleTheme());
        expect(result.current.theme).toBe('light');
        act(() => result.current.cycleTheme());
        expect(result.current.theme).toBe('hybrid');
        act(() => result.current.cycleTheme());
        expect(result.current.theme).toBe('dark');
    });

    it('useTheme provider dışı kullanılırsa throw eder', () => {
        // Provider olmadan
        expect(() => renderHook(() => useTheme())).toThrow();
    });
});
