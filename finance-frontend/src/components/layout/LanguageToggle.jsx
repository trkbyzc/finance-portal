import { useTranslation } from 'react-i18next';

/**
 * TR / EN segmented control — ThemeToggle ile aynı görsel dil.
 */
const LANGUAGES = [
    { code: 'tr', label: 'TR', tooltip: 'Türkçe' },
    { code: 'en', label: 'EN', tooltip: 'English' }
];

export default function LanguageToggle() {
    const { i18n } = useTranslation();
    const current = i18n.language?.startsWith('en') ? 'en' : 'tr';

    return (
        <div
            className="inline-flex items-center gap-0.5 bg-surface-2 border border-border rounded-lg p-0.5 shadow-sm"
            role="radiogroup"
            aria-label="Dil seçici / Language selector"
        >
            {LANGUAGES.map((lang) => {
                const active = current === lang.code;
                return (
                    <div key={lang.code} className="relative group">
                        <button
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={lang.tooltip}
                            onClick={() => i18n.changeLanguage(lang.code)}
                            className={`flex items-center justify-center px-1 sm:px-2 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-[11px] font-black tracking-wider transition-all duration-150 ${
                                active
                                    ? 'bg-primary text-primary-fg shadow-sm'
                                    : 'text-text-muted hover:text-text hover:bg-surface-hover'
                            }`}
                        >
                            {lang.label}
                        </button>

                        <span
                            className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-md bg-bg-elevated text-text text-[10px] font-semibold tracking-wider whitespace-nowrap opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 shadow-lg border border-border z-50"
                        >
                            {lang.tooltip}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
