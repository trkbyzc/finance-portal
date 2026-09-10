import { Moon, Sun, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

/**
 * 3 tema arasında segmented control + sade, modern hover tooltip.
 * Tooltip/aria metinleri i18n'den gelir (navbar:theme.*) — dile göre TR/EN değişir.
 */
const THEME_META = {
    light: { icon: Sun, key: 'theme.light' },
    hybrid: { icon: Layers, key: 'theme.hybrid' },
    dark: { icon: Moon, key: 'theme.dark' }
};

export default function ThemeToggle({ compact = false }) {
    const { theme, setTheme } = useTheme();
    const { t } = useTranslation('navbar');

    return (
        <div
            className="inline-flex items-center gap-0.5 bg-surface-2 border border-border rounded-lg p-0.5 shadow-sm"
            role="radiogroup"
            aria-label={t('theme.selector')}
        >
            {Object.entries(THEME_META).map(([key, meta]) => {
                const Icon = meta.icon;
                const active = theme === key;
                const tooltip = t(meta.key);
                return (
                    <div key={key} className="relative group">
                        <button
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={tooltip}
                            onClick={() => setTheme(key)}
                            className={`flex items-center justify-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-md transition-all duration-150 ${
                                active
                                    ? 'bg-primary text-primary-fg shadow-sm'
                                    : 'text-text-muted hover:text-text hover:bg-surface-hover'
                            }`}
                        >
                            <Icon size={compact ? 14 : 15} strokeWidth={2.2} />
                        </button>

                        {/* Custom tooltip — sade, modern, position fixed olmadığı için layout breakout yok */}
                        <span
                            className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-md bg-bg-elevated text-text text-[10px] font-semibold tracking-wider whitespace-nowrap opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 shadow-lg border border-border z-50"
                        >
                            {tooltip}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
