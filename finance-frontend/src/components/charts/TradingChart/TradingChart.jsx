import React, { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react';
import { registerCustomOverlays } from '../../../config/customOverlays.js';
import { useChartData } from '../../../hooks/charts/useChartData';
import { useChartInstance } from './hooks/useChartInstance';
import { useChartIndicators } from './hooks/useChartIndicators';
import { useChartOverlays } from './hooks/useChartOverlays';
import useBenchmarkOverlay from './hooks/useBenchmarkOverlay';
import { normalizeSymbol, getDisplayName, getChartType, isTurkishBond, isTurkishGold } from './utils/symbolUtils';
import { useCurrency } from '../../../context/CurrencyContext';
import { detectNativeCurrency, isYieldAsset } from '../../../utils/currencyConversion';
import { computePricePrecision, computePriceLabelDigits } from '../../../utils/priceFormat';
import { BIST_OPTIONS, CRYPTO_OPTIONS } from './tradingChartConstants';

import ChartHeader from './components/ChartHeader';
import ChartOhlcvBar from './components/ChartOhlcvBar';
import ChartSidebar from './components/ChartSidebar';
import ChartStatusOverlay from './components/ChartStatusOverlay';
import BenchmarkCompareBar from './components/BenchmarkCompareBar';
import BenchmarkOverlayChart from './components/BenchmarkOverlayChart';
import PriceChart from './components/PriceChart';

registerCustomOverlays();

/**
 * Ana chart orchestrator'ı.
 *
 * Üç ana render modu var (öncelik sırasına göre):
 *   1. Benchmark overlay (BIST veya BITW seçilince) — recharts AreaChart, % normalize
 *   2. Recharts area/line (currency, eurobond, LINE chartType)
 *   3. KLineCharts candle (default)
 *
 * Benchmark overlay logic (toggle state + fetch + normalize) useBenchmarkOverlay hook'una
 * çıkarıldı. Compare bar (BIST + Crypto) generic BenchmarkCompareBar component'i.
 * Currency conversion + price formatting orchestrator'da kaldı (context'e bağlı).
 */
function TradingChart({ asset, initialRange = '1y' }) {
    const klineContainer = useRef();

    const backendSymbol = useMemo(() => normalizeSymbol(asset), [asset]);
    const chartType = useMemo(() => getChartType(asset), [asset]);
    const displayName = useMemo(() => getDisplayName(asset, backendSymbol), [asset, backendSymbol]);
    const isTrBond = useMemo(() => isTurkishBond(backendSymbol), [backendSymbol]);

    const isCurrency = asset?.assetCategory === 'CURRENCY';
    const isEurobond = asset?.assetCategory === 'EUROBOND';
    const isGold = useMemo(() => isTurkishGold(backendSymbol), [backendSymbol]);
    const useRecharts = chartType === 'LINE' || isCurrency;
    const useAreaChart = isCurrency || isEurobond || isGold; // gram altın da döviz gibi area
    const isNone = chartType === 'NONE';

    const [activeRange, setActiveRange] = useState(isTrBond ? 'ytd' : initialRange);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [candleType, setCandleType] = useState('candle_solid');

    const { data: rawChartData = [], isLoading, error } = useChartData(
        backendSymbol, asset?.assetCategory, activeRange, customStartDate, customEndDate, isNone
    );

    // Currency conversion (TRY/USD toggle)
    const { currency, convertPrice } = useCurrency();
    const nativeCurrency = useMemo(() => asset?.nativeCurrency || detectNativeCurrency(asset), [asset]);
    const isYield = useMemo(() => isYieldAsset(asset), [asset]);
    const shouldConvert = !isYield && !isCurrency && currency !== nativeCurrency;
    const displayCurrency = isCurrency ? 'TRY' : currency;
    const currencySymbol = displayCurrency === 'TRY' ? '₺' : '$';

    const formatPriceLabel = (v) => {
        if (v == null || Number.isNaN(v)) return '';
        const locale = displayCurrency === 'TRY' ? 'tr-TR' : 'en-US';
        const digits = computePriceLabelDigits(v);
        return `${currencySymbol}${Number(v).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: digits })}`;
    };

    const chartData = useMemo(() => {
        if (!shouldConvert || !rawChartData?.length) return rawChartData;
        return rawChartData.map(d => ({
            ...d,
            open: convertPrice(d.open, nativeCurrency),
            high: convertPrice(d.high, nativeCurrency),
            low: convertPrice(d.low, nativeCurrency),
            close: convertPrice(d.close, nativeCurrency)
        }));
    }, [rawChartData, shouldConvert, nativeCurrency, convertPrice]);

    // Benchmark overlay (BIST + Crypto)
    const {
        isTrStock, isCrypto,
        activeBists, toggleBist,
        activeCryptoBench, toggleCryptoBench,
        showOverlayChart, overlayChartData, overlayBenchmarks
    } = useBenchmarkOverlay({ asset, rawChartData, activeRange, customStartDate, customEndDate });

    // Overlay aktifken zorla recharts moduna geç (klinecharts dispose)
    const useRechartsFinal = useRecharts || showOverlayChart;

    // Crosshair ile gezilen mum (hover) — yoksa son mum gösterilir
    const [hoverCandle, setHoverCandle] = useState(null);
    const handleCrosshairChange = useCallback((data) => {
        setHoverCandle(data?.kLineData ?? null);
    }, []);
    // Sembol/aralık/para birimi değişince hover sıfırlansın — render sırasında guard'lı reset
    // (React'in "you might not need an effect" deseni; effect içinde setState yok).
    // currency dahil: $/₺ toggle'ında hover snapshot'ı eski kurda kalıp kartları yanıltmasın.
    const resetKey = `${backendSymbol}|${activeRange}|${currency}`;
    const [prevResetKey, setPrevResetKey] = useState(resetKey);
    if (resetKey !== prevResetKey) {
        setPrevResetKey(resetKey);
        setHoverCandle(null);
    }

    // Kline + indicator + overlay (drawing tool) hooks
    const chartInstance = useChartInstance(klineContainer, candleType, useRechartsFinal, isNone, handleCrosshairChange);
    const { activeIndicators, toggleIndicator } = useChartIndicators(chartInstance);
    const { editingText, setEditingText, createOverlay, removeAllOverlays, updateTextOverlay } = useChartOverlays(chartInstance);

    // KLineCharts data apply + dynamic precision (PEPE/SHIB gibi düşük fiyatlı coinler için)
    useEffect(() => {
        if (!useRechartsFinal && !isNone && chartInstance.current && chartData.length > 0) {
            const maxPrice = chartData.reduce((m, d) => Math.max(m, d.close || 0, d.high || 0), 0);
            chartInstance.current.setPriceVolumePrecision(computePricePrecision(maxPrice), 0);
            chartInstance.current.applyNewData(chartData);
        }
    }, [chartData, useRechartsFinal, isNone, candleType]);

    if (isNone) {
        return <div className="h-125 flex items-center justify-center bg-surface text-text-muted">📊 Desteklenmiyor.</div>;
    }

    return (
        <div className="w-full h-full min-h-150 flex flex-col rounded-xl overflow-hidden bg-surface relative shadow-2xl">
            <ChartHeader
                displayName={displayName} isTrBond={isTrBond}
                activeRange={activeRange} setActiveRange={setActiveRange}
                isLineChart={useRechartsFinal} chartType={candleType} changeChartType={setCandleType}
                activeIndicators={activeIndicators} toggleIndicator={toggleIndicator}
                customStartDate={customStartDate} setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate} setCustomEndDate={setCustomEndDate}
                handleCustomDateSubmit={() => setActiveRange('custom')}
                disableInteraction={showOverlayChart}
            />

            {/* OHLC + Hacim özeti — sadece klinecharts (candle) modunda, başlığın altında */}
            {!useRechartsFinal && !isNone && chartData.length > 0 && (
                <ChartOhlcvBar
                    candle={hoverCandle || chartData[chartData.length - 1]}
                    formatPriceLabel={formatPriceLabel}
                />
            )}

            {isTrStock && (
                <BenchmarkCompareBar
                    labelKey="bistCompare"
                    activeLabelKey="bistCompareActive"
                    options={BIST_OPTIONS}
                    activeMap={activeBists}
                    onToggle={toggleBist}
                    buttonColor="#2962ff"
                />
            )}

            {isCrypto && (
                <BenchmarkCompareBar
                    labelKey="cryptoCompare"
                    activeLabelKey="cryptoCompareActive"
                    options={CRYPTO_OPTIONS}
                    activeMap={activeCryptoBench}
                    onToggle={toggleCryptoBench}
                    buttonColor="#2962ff"
                />
            )}

            <div className="flex flex-1 overflow-hidden relative">
                {!useRechartsFinal && (
                    <ChartSidebar onDraw={createOverlay} onRemoveAll={removeAllOverlays} />
                )}

                <div className="flex-1 w-full bg-surface relative p-2">
                    <ChartStatusOverlay isLoading={isLoading} error={error} />

                    {showOverlayChart ? (
                        <BenchmarkOverlayChart
                            overlayChartData={overlayChartData}
                            overlayBenchmarks={overlayBenchmarks}
                            displayName={displayName}
                        />
                    ) : useRecharts ? (
                        <PriceChart
                            chartData={chartData}
                            useAreaChart={useAreaChart}
                            isYield={isYield}
                            formatPriceLabel={formatPriceLabel}
                        />
                    ) : (
                        <div ref={klineContainer} className="w-full h-full absolute inset-0" />
                    )}

                    {editingText && (
                        <input
                            type="text" autoFocus
                            className="absolute bg-surface text-text border border-primary px-2 py-1 z-50 rounded outline-none"
                            style={{ left: editingText.x, top: editingText.y }}
                            value={editingText.text}
                            onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
                            onBlur={() => updateTextOverlay(editingText.text)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default memo(TradingChart);
