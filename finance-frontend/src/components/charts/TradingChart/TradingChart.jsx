import React, { useEffect, useRef, useState, memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { registerCustomOverlays } from '../../../config/customOverlays.js';
import { useChartData } from '../../../hooks/charts/useChartData';
import { useChartInstance } from './hooks/useChartInstance';
import { useChartIndicators } from './hooks/useChartIndicators';
import { useChartOverlays } from './hooks/useChartOverlays';
import { normalizeSymbol, getDisplayName, getChartType, isTurkishBond } from './utils/symbolUtils';

import ChartHeader from './components/ChartHeader';
import ChartSidebar from './components/ChartSidebar';
import ChartStatusOverlay from './components/ChartStatusOverlay';

registerCustomOverlays();

// 🚀 FAZA 2: Component Refactoring - TradingChart modüler hale getirildi
function TradingChart({ asset, initialRange = '1y' }) {
    const klineContainer = useRef();

    // Symbol ve chart type hesaplamaları (utils'den)
    const backendSymbol = useMemo(() => normalizeSymbol(asset), [asset]);
    const chartType = useMemo(() => getChartType(asset), [asset]);
    const displayName = useMemo(() => getDisplayName(asset, backendSymbol), [asset, backendSymbol]);
    const isTrBond = useMemo(() => isTurkishBond(backendSymbol), [backendSymbol]);
    
    const isLineChart = chartType === 'LINE';
    const isNone = chartType === 'NONE';

    // State yönetimi
    const [activeRange, setActiveRange] = useState(isTrBond ? 'ytd' : initialRange);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [candleType, setCandleType] = useState('candle_solid');

    // 🚀 FAZA 1: Veri çekme (React Query)
    const { data: chartData = [], isLoading, error } = useChartData(
        backendSymbol,
        activeRange,
        customStartDate,
        customEndDate,
        isNone
    );

    // 🚀 FAZA 2: Custom hooks ile modüler yönetim
    const chartInstance = useChartInstance(klineContainer, candleType, isLineChart, isNone);
    const { activeIndicators, toggleIndicator } = useChartIndicators(chartInstance);
    const { editingText, setEditingText, createOverlay, removeAllOverlays, updateTextOverlay } = useChartOverlays(chartInstance);

    // Chart data güncelleme (side effect)
    // Chart instance veya data değiştiğinde data'yı uygula
    useEffect(() => {
        if (!isLineChart && !isNone && chartInstance.current && chartData.length > 0) {
            chartInstance.current.applyNewData(chartData);
        }
    }, [chartData, isLineChart, isNone, candleType]);

    if (isNone) return <div className="h-[500px] flex items-center justify-center bg-[#131722] text-[#868993]">📊 Desteklenmiyor.</div>;

    return (
        <div className="w-full h-full min-h-[600px] flex flex-col rounded-xl overflow-hidden bg-[#131722] relative shadow-2xl">
            <ChartHeader
                displayName={displayName} isTrBond={isTrBond} activeRange={activeRange} setActiveRange={setActiveRange}
                isLineChart={isLineChart} chartType={candleType} changeChartType={setCandleType}
                activeIndicators={activeIndicators} toggleIndicator={toggleIndicator}
                customStartDate={customStartDate} setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate} setCustomEndDate={setCustomEndDate}
                handleCustomDateSubmit={() => setActiveRange('custom')}
            />

            <div className="flex flex-1 overflow-hidden relative">
                {!isLineChart && (
                    <ChartSidebar
                        onDraw={createOverlay}
                        onRemoveAll={removeAllOverlays}
                    />
                )}

                <div className="flex-1 w-full bg-[#131722] relative p-2">
                    <ChartStatusOverlay isLoading={isLoading} error={error} />

                    {isLineChart ? (
                        <div className="w-full h-full p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                                    <XAxis dataKey="dateStr" stroke="#787b86" tick={{ fontSize: 11 }} />
                                    <YAxis stroke="#787b86" orientation="right" tickFormatter={(v) => `%${v.toFixed(2)}`} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39' }} />
                                    <Line type="monotone" dataKey="close" stroke="#2962ff" strokeWidth={3} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div ref={klineContainer} className="w-full h-full absolute inset-0" />
                    )}

                    {editingText && (
                        <input
                            type="text" autoFocus className="absolute bg-[#131722] text-white border border-[#2962ff] px-2 py-1 z-50 rounded outline-none"
                            style={{ left: editingText.x, top: editingText.y }}
                            value={editingText.text}
                            onChange={(e) => setEditingText({...editingText, text: e.target.value})}
                            onBlur={() => updateTextOverlay(editingText.text)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default memo(TradingChart);