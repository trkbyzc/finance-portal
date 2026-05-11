import React from 'react';
import { BarChart2, Activity, Mountain, SlidersHorizontal, Calendar } from 'lucide-react';

export default function ChartHeader({
                                        displayName, isTrBond, activeRange, setActiveRange,
                                        isLineChart, chartType, changeChartType,
                                        activeIndicators, toggleIndicator,
                                        customStartDate, setCustomStartDate,
                                        customEndDate, setCustomEndDate, handleCustomDateSubmit
                                    }) {
    const allTimeframes = [
        { label: '1G', value: '1d' }, { label: '1H', value: '5d' }, { label: '1A', value: '1mo' },
        { label: '3A', value: '3mo' }, { label: '6A', value: '6mo' }, { label: 'YTD', value: 'ytd' },
        { label: '1Y', value: '1y' }, { label: '5Y', value: '5y' }
    ];
    const timeframes = isTrBond ? [{ label: 'YTD', value: 'ytd' }] : allTimeframes;

    return (
        <div className="h-14 bg-[#1e222d] border-b border-[#2a2e39] flex items-center px-4 gap-4 z-10 select-none overflow-x-auto hide-scrollbar">
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

                {!isTrBond && (
                    <div className="flex items-center gap-2 ml-2 bg-[#131722] border border-[#2a2e39] rounded-md px-2 py-1 shadow-inner">
                        <Calendar size={12} className="text-[#787b86]" />
                        <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-transparent text-[#d1d4dc] text-[11px] outline-none font-mono cursor-pointer" />
                        <span className="text-[#2a2e39] font-bold">-</span>
                        <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-transparent text-[#d1d4dc] text-[11px] outline-none font-mono cursor-pointer" />
                        <button onClick={handleCustomDateSubmit} className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${activeRange === 'custom' ? 'bg-[#2962ff] text-white' : 'bg-[#2a2e39] hover:bg-[#2962ff] text-[#d1d4dc] hover:text-white'}`}>
                            UYGULA
                        </button>
                    </div>
                )}
            </div>

            {!isLineChart && (
                <>
                    <div className="w-[1px] h-6 bg-[#2a2e39] mx-1 shrink-0"></div>
                    <div className="flex gap-1 shrink-0">
                        <button onClick={() => changeChartType('candle_solid')} className={`p-1.5 rounded transition-colors ${chartType === 'candle_solid' ? 'text-[#2962ff] bg-[#2962ff]/10' : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'}`} title="Mum Grafik"><BarChart2 size={18} /></button>
                        <button onClick={() => changeChartType('ohlc')} className={`p-1.5 rounded transition-colors ${chartType === 'ohlc' ? 'text-[#2962ff] bg-[#2962ff]/10' : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'}`} title="Çubuk Grafik"><Activity size={18} /></button>
                        <button onClick={() => changeChartType('area')} className={`p-1.5 rounded transition-colors ${chartType === 'area' ? 'text-[#2962ff] bg-[#2962ff]/10' : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'}`} title="Alan Grafiği"><Mountain size={18} /></button>
                    </div>
                    <div className="w-[1px] h-6 bg-[#2a2e39] mx-1 shrink-0"></div>
                    <div className="flex gap-1 items-center bg-[#131722] border border-[#2a2e39] px-2 py-1 rounded-md shrink-0">
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