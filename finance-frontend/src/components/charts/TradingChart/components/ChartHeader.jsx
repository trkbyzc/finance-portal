import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BarChart2, Activity, Mountain, SlidersHorizontal, Calendar, X } from 'lucide-react';

export default function ChartHeader({
                                        displayName, isTrBond, activeRange, setActiveRange,
                                        isLineChart, chartType, changeChartType,
                                        activeIndicators, toggleIndicator,
                                        customStartDate, setCustomStartDate,
                                        customEndDate, setCustomEndDate, handleCustomDateSubmit,
                                        // BIST overlay aktif olduğunda mum/çubuk/indikatör butonları kullanılamaz
                                        disableInteraction = false
                                    }) {
    const disabledClass = disableInteraction ? 'opacity-40 pointer-events-none cursor-not-allowed' : '';
    const disabledTitle = disableInteraction ? 'BIST karşılaştırması aktifken kullanılamaz' : '';
    const allTimeframes = [
        { label: '1G', value: '1d' }, { label: '1H', value: '5d' }, { label: '1A', value: '1mo' },
        { label: '3A', value: '3mo' }, { label: '6A', value: '6mo' }, { label: 'YTD', value: 'ytd' },
        { label: '1Y', value: '1y' }, { label: '5Y', value: '5y' }
    ];
    const timeframes = isTrBond ? [{ label: 'YTD', value: 'ytd' }] : allTimeframes;

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
        if (!customStartDate || !customEndDate) return 'Hem başlangıç hem bitiş tarihi seçilmelidir';
        if (customStartDate > customEndDate) return 'Başlangıç tarihi bitişten sonra olamaz';
        if (customStartDate < minDate) return `En eski tarih: ${minDate}`;
        if (customEndDate > maxDate) return `Gelecek tarih seçilemez (max: ${maxDate})`;
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
        : 'Özel Aralık';

    return (
        <div className="h-14 bg-[#1e222d] border-b border-[#2a2e39] flex items-center px-4 gap-4 z-10 select-none overflow-x-auto hide-scrollbar relative">
            <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-lg text-white uppercase tracking-wide">{displayName}</span>
            </div>
            <div className="w-[1px] h-6 bg-[#2a2e39] mx-1 shrink-0"></div>

            <div className="flex gap-1 shrink-0 items-center">
                {timeframes.map((tf) => (
                    <button
                        key={tf.value}
                        onClick={() => setActiveRange(tf.value)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded transition-all ${activeRange === tf.value ? 'bg-[#2962ff] text-white shadow-md' : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'}`}
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
                                    ? 'bg-[#2962ff] text-white border-[#2962ff] shadow-md'
                                    : 'bg-[#131722] text-[#d1d4dc] border-[#2a2e39] hover:border-[#2962ff] hover:text-white'
                            }`}
                            title="Özel tarih aralığı seç"
                        >
                            <Calendar size={13} />
                            <span className="font-mono">{customRangeLabel}</span>
                        </button>

                        {pickerOpen && createPortal((
                            <div
                                ref={popoverRef}
                                style={{ position: 'fixed', top: popoverPos.top, left: popoverPos.left, zIndex: 9999 }}
                                className="w-[340px] bg-[#131722] border border-[#2a2e39] rounded-xl shadow-2xl p-5"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Calendar size={14} className="text-[#2962ff]" />
                                        Özel Tarih Aralığı
                                    </h3>
                                    <button
                                        onClick={() => setPickerOpen(false)}
                                        className="text-[#868993] hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#868993] mb-1.5">
                                            Başlangıç Tarihi
                                        </label>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            min={minDate}
                                            max={maxDate}
                                            onChange={e => setCustomStartDate(e.target.value)}
                                            className="w-full bg-[#1e222d] border border-[#2a2e39] hover:border-[#2962ff] focus:border-[#2962ff] focus:ring-1 focus:ring-[#2962ff] text-white text-sm font-mono px-3 py-2 rounded-lg outline-none transition cursor-pointer [color-scheme:dark]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#868993] mb-1.5">
                                            Bitiş Tarihi
                                        </label>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            min={customStartDate || minDate}
                                            max={maxDate}
                                            onChange={e => setCustomEndDate(e.target.value)}
                                            className="w-full bg-[#1e222d] border border-[#2a2e39] hover:border-[#2962ff] focus:border-[#2962ff] focus:ring-1 focus:ring-[#2962ff] text-white text-sm font-mono px-3 py-2 rounded-lg outline-none transition cursor-pointer [color-scheme:dark]"
                                        />
                                    </div>

                                    {validationMsg && (
                                        <div className="text-[11px] text-[#f23645] bg-[#f23645]/10 border border-[#f23645]/30 px-3 py-2 rounded-md">
                                            ⚠ {validationMsg}
                                        </div>
                                    )}

                                    <div className="text-[10px] text-[#868993] italic">
                                        Veri aralığı: {minDate} → {maxDate}
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => {
                                                setCustomStartDate('');
                                                setCustomEndDate('');
                                            }}
                                            className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-[#1e222d] border border-[#2a2e39] text-[#868993] hover:text-white hover:border-[#868993] transition"
                                        >
                                            Temizle
                                        </button>
                                        <button
                                            onClick={handleApply}
                                            disabled={!datesValid}
                                            className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition shadow ${
                                                datesValid
                                                    ? 'bg-[#2962ff] hover:bg-[#1e4db7] text-white'
                                                    : 'bg-[#2a2e39] text-[#868993] cursor-not-allowed opacity-50'
                                            }`}
                                        >
                                            Uygula
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
                    <div className="w-[1px] h-6 bg-[#2a2e39] mx-1 shrink-0"></div>
                    <div className={`flex gap-1 shrink-0 ${disabledClass}`} title={disabledTitle}>
                        <button onClick={() => changeChartType('candle_solid')} className={`p-1.5 rounded transition-colors ${chartType === 'candle_solid' ? 'text-[#2962ff] bg-[#2962ff]/10' : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'}`} title={disabledTitle || "Mum Grafik"}><BarChart2 size={18} /></button>
                        <button onClick={() => changeChartType('ohlc')} className={`p-1.5 rounded transition-colors ${chartType === 'ohlc' ? 'text-[#2962ff] bg-[#2962ff]/10' : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'}`} title={disabledTitle || "Çubuk Grafik"}><Activity size={18} /></button>
                        <button onClick={() => changeChartType('area')} className={`p-1.5 rounded transition-colors ${chartType === 'area' ? 'text-[#2962ff] bg-[#2962ff]/10' : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'}`} title={disabledTitle || "Alan Grafiği"}><Mountain size={18} /></button>
                    </div>
                    <div className="w-[1px] h-6 bg-[#2a2e39] mx-1 shrink-0"></div>
                    <div className={`flex gap-1 items-center bg-[#131722] border border-[#2a2e39] px-2 py-1 rounded-md shrink-0 ${disabledClass}`} title={disabledTitle}>
                        <SlidersHorizontal size={14} className="text-[#787b86] mr-1" />
                        {['MA', 'BOLL', 'MACD', 'RSI', 'VOL'].map((ind) => (
                            <button key={ind} onClick={() => toggleIndicator(ind)} className={`text-[11px] px-2 py-1 rounded transition-all font-bold ${activeIndicators.includes(ind) ? 'text-[#2962ff] bg-[#2962ff]/10' : 'text-[#787b86] hover:text-white'}`}>{ind}</button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
