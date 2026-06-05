import { Moon, Sun, Layers } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * 3 tema arasında segmented control + sade, modern hover tooltip.
 */
const THEME_META = {
    light: { icon: Sun, tooltip: 'Açık Tema' },
    hybrid: { icon: Layers, tooltip: 'Hibrit Tema' },
    dark: { icon: Moon, tooltip: 'Koyu Tema' }
};

export default function ThemeToggle({ compact = false }) {
    const { theme, setTheme } = useTheme();

    return (
        <div
            className="inline-flex items-center gap-0.5 bg-surface-2 border border-border rounded-lg p-0.5 shadow-sm"
            role="radiogroup"
            aria-label="Tema seçici"
        >
            {Object.entries(THEME_META).map(([key, meta]) => {
                const Icon = meta.icon;
                const active = theme === key;
                return (
                    <div key={key} className="relative group">
                        <button
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={meta.tooltip}
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
                            {meta.tooltip}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
