import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AreaChart, CandlestickChart } from 'lucide-react';
import { init, dispose } from 'klinecharts';
import { formatIndexName } from '../LiveMarketUtils';

const rangeButtons = [
    { label: '1G', value: '1d' }, { label: '1A', value: '1mo' },
    { label: '3A', value: '3mo' }, { label: '1Y', value: '1y' },
    { label: '5Y', value: '5y' }, { label: 'TÜMÜ', value: 'max' }
];

export default function ChartSection({ selectedSymbol }) {
    const chartRef = useRef();
    const chartInstance = useRef();
    const [selectedRange, setSelectedRange] = useState('1mo');
    const [chartType, setChartType] = useState('area');

    useEffect(() => {
        if (!chartRef.current || !selectedSymbol) return;
        if (chartInstance.current) dispose(chartRef.current);

        chartInstance.current = init(chartRef.current, {
            grid: { show: false },
            xAxis: { axisLine: { show: false }, tickText: { color: '#868993', size: 10 } },
            yAxis: { position: 'right', axisLine: { show: false }, tickText: { color: '#868993', size: 10 } },
            tooltip: { showRule: 'none' }
        });

        const fetchHistory = async () => {
            try {
                const res = await axios.get(`http://localhost:8081/api/market-data/historical`, { params: { symbol: selectedSymbol, range: selectedRange } });
                const chartData = res.data.map(d => ({ timestamp: new Date(d.date).getTime(), open: d.open, high: d.high, low: d.low, close: d.close }));

                chartInstance.current.applyNewData(chartData);

                if (chartType === 'area') {
                    chartInstance.current.setStyles({ candle: { type: 'area', area: { lineColor: '#2962ff', fillColor: [{ offset: 0, color: 'rgba(41, 98, 255, 0.3)' }, { offset: 1, color: 'rgba(41, 98, 255, 0)' }] } } });
                } else {
                    chartInstance.current.setStyles({ candle: { type: 'candle_solid' } });
                }
            } catch (e) { console.error("Grafik geçmişi çekilemedi:", e); }
        };

        fetchHistory();
        return () => dispose(chartRef.current);
    }, [selectedSymbol, chartType, selectedRange]);

    return (
        <div className="bg-[#131722] border border-[#2a2e39] rounded-3xl p-4 md:p-6 mb-12 h-[500px] relative shadow-2xl">
            <div className="absolute top-6 right-6 z-20 text-right">
                <div className="text-xl font-bold text-white uppercase">{formatIndexName(selectedSymbol)}</div>
                <div className="text-sm text-[#868993]">Anlık Fiyat Özeti</div>
            </div>
            <div className="absolute top-6 left-6 z-20 flex items-center gap-1 bg-[#0b0e14]/80 backdrop-blur p-1 rounded-xl border border-[#2a2e39]">
                <button onClick={() => setChartType('area')} className={`p-2 rounded-lg transition-all ${chartType === 'area' ? 'bg-[#2962ff] text-white shadow-lg' : 'text-[#787b86] hover:text-white'}`}><AreaChart size={18} /></button>
                <button onClick={() => setChartType('candle_solid')} className={`p-2 rounded-lg transition-all ${chartType === 'candle_solid' ? 'bg-[#2962ff] text-white shadow-lg' : 'text-[#787b86] hover:text-white'}`}><CandlestickChart size={18} /></button>
            </div>
            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1 bg-[#0b0e14]/80 backdrop-blur p-1 rounded-xl border border-[#2a2e39]">
                {rangeButtons.map((btn) => (
                    <button key={btn.value} onClick={() => setSelectedRange(btn.value)} className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${selectedRange === btn.value ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white hover:bg-[#1e222d]'}`}>{btn.label}</button>
                ))}
            </div>
            <div ref={chartRef} className="w-full h-full pt-12" />
        </div>
    );
}