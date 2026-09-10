import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

const { themeRef } = vi.hoisted(() => ({ themeRef: { current: { theme: 'dark', setTheme: vi.fn() } } }));
vi.mock('../../context/ThemeContext', () => ({
    useTheme: () => themeRef.current,
}));
// Etiketler i18n'den gelir (navbar:theme.*). Gerçek TR çeviri dosyasından çözüyoruz ki
// bir anahtar yeniden adlandırılırsa test bunu yakalasın.
vi.mock('react-i18next', async () => {
    const navbar = (await import('../../i18n/locales/tr/navbar.json')).default;
    const lookup = (key) => key.split('.').reduce((o, part) => (o == null ? o : o[part]), navbar);
    return { useTranslation: () => ({ t: (key, fallback) => lookup(key) ?? fallback ?? key }) };
});

import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
    beforeEach(() => {
        themeRef.current = { theme: 'dark', setTheme: vi.fn() };
    });

    it('üç tema butonu render eder', () => {
        const { container } = render(<ThemeToggle />);
        const buttons = container.querySelectorAll('button[role="radio"]');
        expect(buttons).toHaveLength(3);
    });

    it("aktif tema için aria-checked=true", () => {
        themeRef.current.theme = 'light';
        const { container } = render(<ThemeToggle />);
        const lightBtn = container.querySelector('[aria-label="Açık Tema"]');
        expect(lightBtn.getAttribute('aria-checked')).toBe('true');
    });

    it("inaktif temalar aria-checked=false", () => {
        themeRef.current.theme = 'dark';
        const { container } = render(<ThemeToggle />);
        const lightBtn = container.querySelector('[aria-label="Açık Tema"]');
        expect(lightBtn.getAttribute('aria-checked')).toBe('false');
    });

    it("button click → setTheme(key)", () => {
        const setTheme = vi.fn();
        themeRef.current = { theme: 'dark', setTheme };
        const { container } = render(<ThemeToggle />);
        fireEvent.click(container.querySelector('[aria-label="Hibrit Tema"]'));
        expect(setTheme).toHaveBeenCalledWith('hybrid');
    });

    it("compact prop → ikon küçük (smoke render)", () => {
        const { container } = render(<ThemeToggle compact />);
        expect(container.querySelectorAll('button')).toHaveLength(3);
    });

    it("radiogroup role + aria-label", () => {
        const { container } = render(<ThemeToggle />);
        const group = container.querySelector('[role="radiogroup"]');
        expect(group).toBeTruthy();
        expect(group.getAttribute('aria-label')).toBe('Tema seçici');
    });
});
