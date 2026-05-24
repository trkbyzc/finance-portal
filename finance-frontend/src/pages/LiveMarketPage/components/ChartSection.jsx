import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../config/apiClient';
import { AreaChart, CandlestickChart, ExternalLink } from 'lucide-react';
import { init, dispose } from 'klinecharts';
import { useTranslation } from 'react-i18next';
import { formatIndexName } from '../LiveMarketUtils';

const RANGE_KEYS = [
    { key: '1d', value: '1d' },
    { key: '1w', value: '5d' },
    { key: '1m', value: '1mo' },
    { key: '3m', value: '3mo' },
    { key: '1y', value: '1y' },
    { key: '5y', value: '5y' }
];

export default function ChartSection({ selectedSymbol, onNavigateToMarket }) {
    const chartRef = useRef();
    const chartInstance = useRef();
    const [selectedRange, setSelectedRange] = useState('1mo');
    const [chartType, setChartType] = useState('area');
    const { t } = useTranslation(['common', 'markets']);

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
                        category: 'TR_INDEX'
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
            } catch (e) { console.error("Chart history fetch failed:", e); }
        };

        fetchHistory();
        return () => dispose(chartRef.current);
    }, [selectedSymbol, chartType, selectedRange]);

    return (
        <div className="mb-12">
            <div className="bg-surface border border-border rounded-3xl p-4 md:p-6 h-[500px] relative shadow-2xl">
                <div className="absolute top-6 right-6 z-20 text-right">
                    <div className="text-xl font-bold text-text uppercase">{formatIndexName(selectedSymbol)}</div>
                    <div className="text-sm text-text-muted">{t('markets:live.snapshotSubtitle')}</div>
                </div>

                <div className="absolute top-6 left-6 z-20 flex items-center gap-1 bg-bg/80 backdrop-blur p-1 rounded-xl border border-border">
                    <button onClick={() => setChartType('area')} className={`p-2 rounded-lg transition-all ${chartType === 'area' ? 'bg-primary text-text shadow-lg' : 'text-text-muted hover:text-text'}`}><AreaChart size={18} /></button>
                    <button onClick={() => setChartType('candle_solid')} className={`p-2 rounded-lg transition-all ${chartType === 'candle_solid' ? 'bg-primary text-text shadow-lg' : 'text-text-muted hover:text-text'}`}><CandlestickChart size={18} /></button>
                </div>

                <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1 bg-bg/80 backdrop-blur p-1 rounded-xl border border-border">
                    {RANGE_KEYS.map((btn) => (
                        <button key={btn.value} onClick={() => setSelectedRange(btn.value)} className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${selectedRange === btn.value ? 'bg-primary text-text' : 'text-text-muted hover:text-text hover:bg-surface-2'}`}>{t(`common:ranges.${btn.key}`)}</button>
                    ))}
                </div>

                <div ref={chartRef} className="w-full h-full pt-12" />
            </div>

            {isBistMainIndex && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => onNavigateToMarket(selectedSymbol)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-text border border-primary/20 rounded-full transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-primary/20"
                    >
                        {t('markets:live.viewAllStocks', { name: formatIndexName(selectedSymbol) })} <ExternalLink size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
