import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BarChart2, Activity, Mountain, SlidersHorizontal, Calendar, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DatePicker from '../../../common/DatePicker';

export default function ChartHeader({
                                        displayName, isTrBond, activeRange, setActiveRange,
                                        isLineChart, chartType, changeChartType,
                                        activeIndicators, toggleIndicator,
                                        customStartDate, setCustomStartDate,
                                        customEndDate, setCustomEndDate, handleCustomDateSubmit,
                                        // BIST overlay aktif olduğunda mum/çubuk/indikatör butonları kullanılamaz
                                        disableInteraction = false
                                    }) {
    const { t } = useTranslation(['charts', 'common']);
    const disabledClass = disableInteraction ? 'opacity-40 pointer-events-none cursor-not-allowed' : '';
    const disabledTitle = disableInteraction ? '' : '';
    const allTimeframes = [
        { label: t('common:ranges.1d'), value: '1d' },
        { label: t('common:ranges.1w'), value: '5d' },
        { label: t('common:ranges.1m'), value: '1mo' },
        { label: t('common:ranges.3m'), value: '3mo' },
        { label: t('common:ranges.6m'), value: '6mo' },
        { label: t('common:ranges.ytd'), value: 'ytd' },
        { label: t('common:ranges.1y'), value: '1y' },
        { label: t('common:ranges.5y'), value: '5y' }
    ];
    const timeframes = isTrBond ? [{ label: t('common:ranges.ytd'), value: 'ytd' }] : allTimeframes;

    // 🆕 Tarih popover state — Portal ile body'ye render edilir, böylece header'ın overflow-x-auto'su tarafından kırpılmaz
    const [pickerOpen, setPickerOpen] = useState(false);
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
    const popoverRef = useRef(null);
    const triggerRef = useRef(null);

    // Trigger pozisyonunu hesapla — popover açılırken ve scroll/resize'da güncelle
    useEffect(() => {
        if (!pickerOpen) return;
        const updatePos = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            const popoverWidth = 340;
            // Sağ kenara yakınsa sola kaydır
            const left = Math.min(rect.left, window.innerWidth - popoverWidth - 16);
            setPopoverPos({ top: rect.bottom + 8, left: Math.max(16, left) });
        };
        updatePos();
        window.addEventListener('scroll', updatePos, true);
        window.addEventListener('resize', updatePos);
        return () => {
            window.removeEventListener('scroll', updatePos, true);
            window.removeEventListener('resize', updatePos);
        };
    }, [pickerOpen]);

    // Min: 10 yıl önce. Max: bugün. Backend Yahoo verisi tipik olarak 10-30 yıl, ortak güvenli alt sınır 10 yıl.
    const { minDate, maxDate } = useMemo(() => {
        const today = new Date();
        const max = today.toISOString().split('T')[0];
        const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
        const min = tenYearsAgo.toISOString().split('T')[0];
        return { minDate: min, maxDate: max };
    }, []);

    // Validation
    const datesValid = !!customStartDate && !!customEndDate && customStartDate <= customEndDate
        && customStartDate >= minDate && customEndDate <= maxDate;
    const validationMsg = (() => {
        if (!customStartDate || !customEndDate) return t('common:labels.date');
        if (customStartDate > customEndDate) return t('common:status.error');
        if (customStartDate < minDate) return `${minDate}`;
        if (customEndDate > maxDate) return `max: ${maxDate}`;
        return null;
    })();

    // Click-outside-to-close
    useEffect(() => {
        if (!pickerOpen) return;
        const handler = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)
                && triggerRef.current && !triggerRef.current.contains(e.target)) {
                setPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [pickerOpen]);

    const handleApply = () => {
        if (!datesValid) return;
        handleCustomDateSubmit();
        setPickerOpen(false);
    };

    const customRangeLabel = activeRange === 'custom' && datesValid
        ? `${customStartDate} → ${customEndDate}`
        : t('common:labels.date');

    return (
        <div className="h-14 bg-surface border-b border-border flex items-center px-4 gap-4 z-10 select-none overflow-x-auto hide-scrollbar relative">
            <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-lg text-text uppercase tracking-wide">{displayName}</span>
            </div>
            <div className="w-px h-6 bg-surface-hover mx-1 shrink-0"></div>

            <div className="flex gap-1 shrink-0 items-center">
                {timeframes.map((tf) => (
                    <button
                        key={tf.value}
                        onClick={() => setActiveRange(tf.value)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded transition-all ${activeRange === tf.value ? 'bg-primary text-text shadow-md' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
                    >
                        {tf.label}
                    </button>
                ))}

                {/* 🆕 Özel Tarih butonu — popover ile açılır */}
                {!isTrBond && (
                    <div className="relative ml-2">
                        <button
                            ref={triggerRef}
                            onClick={() => setPickerOpen(prev => !prev)}
                            className={`flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded transition-all border ${
                                activeRange === 'custom'
                                    ? 'bg-primary text-text border-primary shadow-md'
                                    : 'bg-surface-2 text-text border-border hover:border-primary hover:text-text'
                            }`}
                            title={t('common:labels.date')}
                        >
                            <Calendar size={13} />
                            <span className="font-mono">{customRangeLabel}</span>
                        </button>

                        {pickerOpen && createPortal((
                            <div
                                ref={popoverRef}
                                style={{ position: 'fixed', top: popoverPos.top, left: popoverPos.left, zIndex: 9999 }}
                                className="w-[340px] bg-surface-2 border border-border rounded-xl shadow-2xl p-5"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-text flex items-center gap-2">
                                        <Calendar size={14} className="text-primary" />
                                        {t('common:labels.date')}
                                    </h3>
                                    <button
                                        onClick={() => setPickerOpen(false)}
                                        className="text-text-muted hover:text-text"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                                            {t('common:time.today')}
                                        </label>
                                        <DatePicker
                                            value={customStartDate}
                                            onChange={setCustomStartDate}
                                            min={minDate}
                                            max={maxDate}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                                            {t('common:labels.date')}
                                        </label>
                                        <DatePicker
                                            value={customEndDate}
                                            onChange={setCustomEndDate}
                                            min={customStartDate || minDate}
                                            max={maxDate}
                                        />
                                    </div>

                                    {validationMsg && (
                                        <div className="text-[11px] text-sell bg-sell/10 border border-sell/30 px-3 py-2 rounded-md">
                                            ⚠ {validationMsg}
                                        </div>
                                    )}

                                    <div className="text-[10px] text-text-muted italic">
                                        {minDate} → {maxDate}
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => {
                                                setCustomStartDate('');
                                                setCustomEndDate('');
                                            }}
                                            className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-surface border border-border text-text-muted hover:text-text hover:border-border-strong transition"
                                        >
                                            {t('common:actions.reset')}
                                        </button>
                                        <button
                                            onClick={handleApply}
                                            disabled={!datesValid}
                                            className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition shadow ${
                                                datesValid
                                                    ? 'bg-primary hover:bg-primary-hover text-text'
                                                    : 'bg-surface-hover text-text-muted cursor-not-allowed opacity-50'
                                            }`}
                                        >
                                            {t('common:actions.apply')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ), document.body)}
                    </div>
                )}
            </div>

            {!isLineChart && (
                <>
                    <div className="w-px h-6 bg-surface-hover mx-1 shrink-0"></div>
                    <div className={`flex gap-1 shrink-0 ${disabledClass}`} title={disabledTitle}>
                        <button onClick={() => changeChartType('candle_solid')} className={`p-1.5 rounded transition-colors ${chartType === 'candle_solid' ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`} title={t('charts:types.candle')}><BarChart2 size={18} /></button>
                        <button onClick={() => changeChartType('ohlc')} className={`p-1.5 rounded transition-colors ${chartType === 'ohlc' ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`} title={t('charts:types.ohlc')}><Activity size={18} /></button>
                        <button onClick={() => changeChartType('area')} className={`p-1.5 rounded transition-colors ${chartType === 'area' ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`} title={t('charts:types.area')}><Mountain size={18} /></button>
                    </div>
                    <div className="w-px h-6 bg-surface-hover mx-1 shrink-0"></div>
                    <div className={`flex gap-1 items-center bg-surface-2 border border-border px-2 py-1 rounded-md shrink-0 ${disabledClass}`} title={disabledTitle}>
                        <SlidersHorizontal size={14} className="text-text-muted mr-1" />
                        {['MA', 'BOLL', 'MACD', 'RSI', 'VOL'].map((ind) => (
                            <button key={ind} onClick={() => toggleIndicator(ind)} className={`text-[11px] px-2 py-1 rounded transition-all font-bold ${activeIndicators.includes(ind) ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text'}`}>{ind}</button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
