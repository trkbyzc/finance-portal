import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../config/apiClient';
import { AreaChart, CandlestickChart, ExternalLink } from 'lucide-react';
import { init, dispose } from 'klinecharts';
import { formatIndexName } from '../LiveMarketUtils';

const rangeButtons = [
    { label: '1G', value: '1d' },
    { label: '5G', value: '5d' },
    { label: '1A', value: '1mo' },
    { label: '3A', value: '3mo' },
    { label: '1Y', value: '1y' },
    { label: '5Y', value: '5y' }
];

export default function ChartSection({ selectedSymbol, onNavigateToMarket }) {
    const chartRef = useRef();
    const chartInstance = useRef();
    const [selectedRange, setSelectedRange] = useState('1mo');
    const [chartType, setChartType] = useState('area');

    // 🚀 GÜVENLİK KONTROLÜ: Sadece BIST 100, 50 ve 30 için butonu göster
    const isBistMainIndex = selectedSymbol?.includes('XU100') || selectedSymbol?.includes('XU030') || selectedSymbol?.includes('XU050');

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
                const res = await apiClient.get(`/market-data/historical`, {
                    params: {
                        symbol: selectedSymbol,
                        range: selectedRange,
                        category: 'TR_INDEX' // 🚀 İŞTE ALTIN VURUŞ! Backend'deki BistIndexChartStrategy'i tetikleyecek şifre.
                    }
                });
                const chartData = res.map(d => ({
                    timestamp: new Date(d.date).getTime(),
                    open: d.open, high: d.high, low: d.low, close: d.close
                }));

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
        <div className="mb-12">
            {/* GRAFİK KUTUSU */}
            <div className="bg-[#131722] border border-[#2a2e39] rounded-3xl p-4 md:p-6 h-[500px] relative shadow-2xl">
                {/* Üst Sağ Bilgi */}
                <div className="absolute top-6 right-6 z-20 text-right">
                    <div className="text-xl font-bold text-white uppercase">{formatIndexName(selectedSymbol)}</div>
                    <div className="text-sm text-[#868993]">Anlık Fiyat Özeti</div>
                </div>

                {/* Sol Üst Grafik Tipi Butonları */}
                <div className="absolute top-6 left-6 z-20 flex items-center gap-1 bg-[#0b0e14]/80 backdrop-blur p-1 rounded-xl border border-[#2a2e39]">
                    <button onClick={() => setChartType('area')} className={`p-2 rounded-lg transition-all ${chartType === 'area' ? 'bg-[#2962ff] text-white shadow-lg' : 'text-[#787b86] hover:text-white'}`}><AreaChart size={18} /></button>
                    <button onClick={() => setChartType('candle_solid')} className={`p-2 rounded-lg transition-all ${chartType === 'candle_solid' ? 'bg-[#2962ff] text-white shadow-lg' : 'text-[#787b86] hover:text-white'}`}><CandlestickChart size={18} /></button>
                </div>

                {/* Sol Alt Zaman Butonları */}
                <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1 bg-[#0b0e14]/80 backdrop-blur p-1 rounded-xl border border-[#2a2e39]">
                    {rangeButtons.map((btn) => (
                        <button key={btn.value} onClick={() => setSelectedRange(btn.value)} className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${selectedRange === btn.value ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white hover:bg-[#1e222d]'}`}>{btn.label}</button>
                    ))}
                </div>

                <div ref={chartRef} className="w-full h-full pt-12" />
            </div>

            {/* 🚀 DİNAMİK LİNK: Sadece BIST 100, 50, 30 için grafiğin ALTINA ORTALANDI */}
            {isBistMainIndex && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => onNavigateToMarket(selectedSymbol)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#2962ff]/10 hover:bg-[#2962ff] text-[#2962ff] hover:text-white border border-[#2962ff]/20 rounded-full transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-[#2962ff]/20"
                    >
                        Tüm {formatIndexName(selectedSymbol)} Hisselerini Gör <ExternalLink size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}