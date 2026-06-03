import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr, enUS } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

/**
 * Modern, tema-uyumlu, locale-aware date picker (react-day-picker tabanlı).
 *
 * Native <input type="date"> tarayıcı default'unu değiştirmek için trigger button + popover.
 * Tailwind ile CSS değişkenleri (--color-*) üzerinden 3 temaya da uyumlu.
 *
 * value:    ISO string 'YYYY-MM-DD' veya boş string
 * onChange: (isoString) => void  (boş "" geçilebilir)
 * min:      ISO string (opsiyonel) — bu tarihten önceki günler disabled
 * max:      ISO string (opsiyonel) — bu tarihten sonraki günler disabled
 * placeholder, disabled, className: standart
 */
export default function DatePicker({
    value,
    onChange,
    min,
    max,
    placeholder,
    disabled = false,
    className = ''
}) {
    const { t, i18n } = useTranslation('common');
    const lang = i18n.language?.startsWith('en') ? 'en' : 'tr';
    const locale = lang === 'en' ? enUS : tr;

    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    // Dış tıklama / ESC → kapat
    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const parseIso = (s) => {
        if (!s) return undefined;
        const [y, m, d] = s.split('-').map(Number);
        if (!y || !m || !d) return undefined;
        return new Date(y, m - 1, d);
    };
    const toIso = (d) => {
        if (!d) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    };

    const selected = parseIso(value);
    const minDate = parseIso(min);
    const maxDate = parseIso(max);

    const fmtDisplay = (d) => {
        if (!d) return '';
        return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const disabledDays = [];
    if (minDate) disabledDays.push({ before: minDate });
    if (maxDate) disabledDays.push({ after: maxDate });

    const handleSelect = (date) => {
        onChange(date ? toIso(date) : '');
        if (date) setOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => !disabled && setOpen(o => !o)}
                disabled={disabled}
                className={`w-full flex items-center justify-between gap-2 bg-bg border border-border rounded-lg px-4 py-3 text-left transition focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed ${open ? 'border-primary' : ''}`}
            >
                <span className={selected ? 'text-text' : 'text-text-muted'}>
                    {selected ? fmtDisplay(selected) : (placeholder || t('labels.selectDate', 'Tarih seç'))}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                    {selected && !disabled && (
                        <span
                            role="button"
                            tabIndex={-1}
                            onClick={(e) => { e.stopPropagation(); onChange(''); }}
                            className="p-0.5 text-text-muted hover:text-sell rounded"
                            title={t('actions.clear', 'Temizle')}
                        >
                            <X size={14} />
                        </span>
                    )}
                    <CalendarIcon size={16} className="text-text-muted" />
                </span>
            </button>

            {open && (
                <div className="absolute z-50 mt-2 bg-surface border border-border rounded-xl shadow-2xl p-2 fp-datepicker-popover">
                    <DayPicker
                        mode="single"
                        selected={selected}
                        onSelect={handleSelect}
                        locale={locale}
                        disabled={disabledDays}
                        showOutsideDays
                        weekStartsOn={1}
                        defaultMonth={selected || maxDate || new Date()}
                    />
                    <div className="flex items-center justify-between border-t border-border pt-2 mt-1 px-1">
                        <button
                            type="button"
                            onClick={() => { onChange(''); setOpen(false); }}
                            className="text-xs text-text-muted hover:text-sell transition-colors"
                        >
                            {t('actions.clear', 'Temizle')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const today = new Date();
                                // min/max guard
                                if (minDate && today < minDate) return;
                                if (maxDate && today > maxDate) return;
                                handleSelect(today);
                            }}
                            className="text-xs text-primary font-semibold hover:underline"
                        >
                            {t('labels.today', 'Bugün')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
