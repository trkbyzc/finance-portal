import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../config/apiClient';
import { AreaChart, CandlestickChart, ExternalLink } from 'lucide-react';
import { init, dispose } from 'klinecharts';
import { useTranslation } from 'react-i18next';
import { formatIndexName } from '../LiveMarketUtils';
import { formatKlineDate } from '../../../utils/formatters/dateFormatter';
import ChartOhlcvBar from '../../../components/charts/TradingChart/components/ChartOhlcvBar';

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

    // OHLCV kartları — crosshair ile gezilen mum (yoksa son mum)
    const [bar, setBar] = useState(null);
    const [hover, setHover] = useState(null);
    // Sembol/tip/aralık değişince hover sıfırlansın (render-içi guard'lı reset)
    const resetKey = `${selectedSymbol}|${chartType}|${selectedRange}`;
    const [prevKey, setPrevKey] = useState(resetKey);
    if (resetKey !== prevKey) { setPrevKey(resetKey); setHover(null); }
    const candle = hover || bar;

    const isBistMainIndex = selectedSymbol?.includes('XU100') || selectedSymbol?.includes('XU030') || selectedSymbol?.includes('XU050');

    const formatPriceLabel = (v) => {
        if (v == null || Number.isNaN(v)) return '';
        return `₺${Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    useEffect(() => {
        if (!chartRef.current || !selectedSymbol) return;
        if (chartInstance.current) dispose(chartRef.current);

        chartInstance.current = init(chartRef.current, {
            // Eksen/crosshair tarihleri Türk usulü + doğru saat (TradingChart ile aynı).
            customApi: {
                formatDate: (_dateTimeFormat, timestamp, format) => formatKlineDate(timestamp, format)
            },
            grid: { show: false },
            xAxis: { axisLine: { show: false }, tickText: { color: '#868993', size: 10 } },
            yAxis: { position: 'right', axisLine: { show: false }, tickText: { color: '#868993', size: 10 } },
            // Üstteki "Time/Open/High..." klinecharts legend'i gizli (kendi OHLCV kartlarımız var)
            candle: { tooltip: { showRule: 'none' } }
        });

        chartInstance.current.subscribeAction('onCrosshairChange', (d) => setHover(d?.kLineData ?? null));

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
                    // d.timestamp = doğru intraday epoch (08:55, 09:00…). d.date sadece tarih (saat yok)
                    // → new Date(d.date) UTC gece yarısı = TRY 03:00 olur, tüm eksen etiketleri 03:00 çıkardı.
                    timestamp: d.timestamp ?? new Date(d.date).getTime(),
                    open: d.open, high: d.high, low: d.low, close: d.close
                }));

                chartInstance.current.applyNewData(chartData);
                setBar(chartData.length ? chartData[chartData.length - 1] : null);

                if (chartType === 'area') {
                    chartInstance.current.setStyles({ candle: { type: 'area', tooltip: { showRule: 'none' }, area: { lineColor: '#2962ff', fillColor: [{ offset: 0, color: 'rgba(41, 98, 255, 0.3)' }, { offset: 1, color: 'rgba(41, 98, 255, 0)' }] } } });
                } else {
                    chartInstance.current.setStyles({ candle: { type: 'candle_solid', tooltip: { showRule: 'none' } } });
                }
            } catch (e) { console.error("Chart history fetch failed:", e); }
        };

        fetchHistory();
        return () => dispose(chartRef.current);
    }, [selectedSymbol, chartType, selectedRange]);

    return (
        <div className="mb-12">
            <div className="bg-surface border border-border rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-1 bg-bg/80 backdrop-blur p-1 rounded-xl border border-border">
                        <button onClick={() => setChartType('area')} className={`p-2 rounded-lg transition-all ${chartType === 'area' ? 'bg-primary text-text shadow-lg' : 'text-text-muted hover:text-text'}`}><AreaChart size={18} /></button>
                        <button onClick={() => setChartType('candle_solid')} className={`p-2 rounded-lg transition-all ${chartType === 'candle_solid' ? 'bg-primary text-text shadow-lg' : 'text-text-muted hover:text-text'}`}><CandlestickChart size={18} /></button>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-text uppercase">{formatIndexName(selectedSymbol)}</div>
                        <div className="text-sm text-text-muted">{t('markets:live.snapshotSubtitle')}</div>
                    </div>
                </div>

                {candle && (
                    <div className="mb-3 -mx-1">
                        <ChartOhlcvBar candle={candle} formatPriceLabel={formatPriceLabel} />
                    </div>
                )}

                <div ref={chartRef} className="w-full h-95" />

                <div className="flex items-center gap-1 mt-3 flex-wrap">
                    {RANGE_KEYS.map((btn) => (
                        <button key={btn.value} onClick={() => setSelectedRange(btn.value)} className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${selectedRange === btn.value ? 'bg-primary text-text' : 'text-text-muted hover:text-text hover:bg-surface-2'}`}>{t(`common:ranges.${btn.key}`)}</button>
                    ))}
                </div>
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
