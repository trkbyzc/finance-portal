import { createContext, useContext, useEffect, useState } from 'react';

/**
 * Tema sistemi: 3 tema arasında geçiş + localStorage'a persist.
 *
 * Temalar:
 *   - 'dark'   → slate-tabanlı navy, pure black değil (default)
 *   - 'light'  → kurumsal bankacılık estetiği
 *   - 'hybrid' → koyu header/nav + açık içerik (modern dashboard)
 *
 * CSS variable'lar index.css'te [data-theme="..."] selector'ı altında tanımlı.
 * Bu context body'nin data-theme attribute'ını set ederek temayı değiştirir.
 */

const STORAGE_KEY = 'finansportal-theme';
const VALID_THEMES = ['dark', 'light', 'hybrid'];
const DEFAULT_THEME = 'dark';

const ThemeContext = createContext(null);

const getInitialTheme = () => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && VALID_THEMES.includes(stored)) return stored;
    } catch { /* localStorage erişimi yoksa default'a düş */ }
    return DEFAULT_THEME;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch { /* ignore */ }
    }, [theme]);

    const setTheme = (next) => {
        if (VALID_THEMES.includes(next)) setThemeState(next);
    };

    const cycleTheme = () => {
        const idx = VALID_THEMES.indexOf(theme);
        const next = VALID_THEMES[(idx + 1) % VALID_THEMES.length];
        setThemeState(next);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, themes: VALID_THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
};
