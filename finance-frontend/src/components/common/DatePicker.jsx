import { useEffect, useMemo, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr, enUS } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

/**
 * Modern, tema-uyumlu, locale-aware date picker.
 *
 * react-day-picker (DayPicker) gün grid'i için, header'da kendi yazdığım Ay + Yıl select'leri.
 * Built-in captionLayout="dropdown" yerine custom header — CSS savaşı yerine direkt kontrol.
 *
 * value:    ISO string 'YYYY-MM-DD' veya boş string
 * onChange: (isoString) => void
 * min/max:  ISO string (opsiyonel)
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

    // Görünen ay state — header'daki select'ler buraya yazar, DayPicker buradan okur.
    const [viewMonth, setViewMonth] = useState(() => selected || maxDate || new Date());

    useEffect(() => {
        if (open) setViewMonth(selected || maxDate || new Date());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

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

    // Yıl range: min/max varsa o aralık, yoksa 2000 → (currentYear + 5).
    const yearRange = useMemo(() => {
        const start = (minDate ? minDate.getFullYear() : 2000);
        const end = (maxDate ? maxDate.getFullYear() : new Date().getFullYear() + 5);
        const list = [];
        for (let y = end; y >= start; y--) list.push(y);
        return list;
    }, [minDate, maxDate]);

    const monthNames = useMemo(() => {
        const arr = [];
        for (let m = 0; m < 12; m++) {
            arr.push(new Date(2000, m, 1).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { month: 'long' }));
        }
        return arr;
    }, [lang]);

    const onMonthSelect = (m) => {
        const d = new Date(viewMonth.getFullYear(), m, 1);
        setViewMonth(d);
    };
    const onYearSelect = (y) => {
        const d = new Date(y, viewMonth.getMonth(), 1);
        setViewMonth(d);
    };
    const navPrev = () => {
        const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
        if (minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), 1)) return;
        setViewMonth(d);
    };
    const navNext = () => {
        const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
        if (maxDate && d > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) return;
        setViewMonth(d);
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
                    <div className="flex items-center justify-between gap-2 px-1 pb-2">
                        <div className="flex items-center gap-1.5">
                            <select
                                value={viewMonth.getMonth()}
                                onChange={(e) => onMonthSelect(Number(e.target.value))}
                                className="fp-dp-select"
                            >
                                {monthNames.map((name, idx) => (
                                    <option key={idx} value={idx}>{name}</option>
                                ))}
                            </select>
                            <select
                                value={viewMonth.getFullYear()}
                                onChange={(e) => onYearSelect(Number(e.target.value))}
                                className="fp-dp-select"
                            >
                                {yearRange.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={navPrev}
                                className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-primary transition-colors"
                                aria-label="Previous month"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={navNext}
                                className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-primary transition-colors"
                                aria-label="Next month"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <DayPicker
                        mode="single"
                        selected={selected}
                        onSelect={handleSelect}
                        locale={locale}
                        disabled={disabledDays}
                        showOutsideDays
                        weekStartsOn={1}
                        month={viewMonth}
                        onMonthChange={setViewMonth}
                        hideNavigation
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
