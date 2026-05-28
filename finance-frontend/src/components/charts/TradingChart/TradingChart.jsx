import React, { useEffect, useRef, useState, memo, useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { registerCustomOverlays } from '../../../config/customOverlays.js';
import { useChartData } from '../../../hooks/charts/useChartData';
import { historicalApi } from '../../../services/api';
import { useChartInstance } from './hooks/useChartInstance';
import { useChartIndicators } from './hooks/useChartIndicators';
import { useChartOverlays } from './hooks/useChartOverlays';
import { normalizeSymbol, getDisplayName, getChartType, isTurkishBond } from './utils/symbolUtils';
import { useCurrency } from '../../../context/CurrencyContext';
import { detectNativeCurrency, isYieldAsset } from '../../../utils/currencyConversion';

// BIST overlay sembolleri ve renkleri (sadece TR hisseleri için).
// Yahoo XU050'yi vermediği için Fintables'tan çekiyoruz → category='TR_INDEX', symbol .IS'siz.
// Backend BistIndexChartStrategy bu category'i yakalayıp BistStockClient.fetchIndexHistory ile fintables'a gidiyor.
const BIST_OPTIONS = [
    { key: 'XU100', symbol: 'XU100', label: 'BIST 100', color: '#2962ff', category: 'TR_INDEX' },
    { key: 'XU050', symbol: 'XU050', label: 'BIST 50',  color: '#089981', category: 'TR_INDEX' },
    { key: 'XU030', symbol: 'XU030', label: 'BIST 30',  color: '#f23645', category: 'TR_INDEX' }
];
// Kripto benchmark — Bitwise 10 Crypto Index Fund (BITW). Top 10 kripto market-cap ağırlıklı.
// Yahoo'daki gerçek kripto endeksleri (^CMC200/100/500) delisted (son veri 2024-08); BITW
// endeks fonu olarak canlı ve kavramsal olarak aynı işi görüyor — BIST 30'un kripto karşılığı.
const CRYPTO_OPTIONS = [
    { key: 'BITW', symbol: 'BITW', label: 'BITW (Top 10)', color: '#f7931a', category: 'INDEX' }
];
const ASSET_COLOR = '#ff9800';

import ChartHeader from './components/ChartHeader';
import ChartSidebar from './components/ChartSidebar';
import ChartStatusOverlay from './components/ChartStatusOverlay';

registerCustomOverlays();

function TradingChart({ asset, initialRange = '1y' }) {
    const klineContainer = useRef();
    const { t } = useTranslation('charts');

    // Symbol ve chart type hesaplamaları
    const backendSymbol = useMemo(() => normalizeSymbol(asset), [asset]);
    const chartType = useMemo(() => getChartType(asset), [asset]);
    const displayName = useMemo(() => getDisplayName(asset, backendSymbol), [asset, backendSymbol]);
    const isTrBond = useMemo(() => isTurkishBond(backendSymbol), [backendSymbol]);

    // 🚀 Döviz mi kontrolü ve Recharts (Alan/Çizgi) kullanma kuralı
    const isCurrency = asset?.assetCategory === 'CURRENCY';
    const isEurobond = asset?.assetCategory === 'EUROBOND';
    const useRecharts = chartType === 'LINE' || isCurrency;
    const useAreaChart = isCurrency || isEurobond; // Eurobond için düz alan grafiği
    const isNone = chartType === 'NONE';

    // State yönetimi
    const [activeRange, setActiveRange] = useState(isTrBond ? 'ytd' : initialRange);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [candleType, setCandleType] = useState('candle_solid');

    // 🆕 BIST overlay state (sadece TR hisseleri için)
    const isTrStock = useMemo(() => {
        const sym = (asset?.symbol || asset?.yahooSymbol || '').toUpperCase();
        return sym.endsWith('.IS') && asset?.assetCategory !== 'INDEX' && !sym.startsWith('X');
    }, [asset]);

    const [activeBists, setActiveBists] = useState({ XU100: false, XU050: false, XU030: false });
    const hasBistOverlay = useMemo(() => Object.values(activeBists).some(Boolean), [activeBists]);
    const toggleBist = (key) => setActiveBists(prev => ({ ...prev, [key]: !prev[key] }));

    // 🆕 Kripto benchmark overlay state (sadece kriptolar için — ^CMC200 ile karşılaştırma)
    const isCrypto = useMemo(() => asset?.assetCategory === 'CRYPTO', [asset]);
    const [activeCryptoBench, setActiveCryptoBench] = useState({ BITW: false });
    const hasCryptoOverlay = useMemo(() => Object.values(activeCryptoBench).some(Boolean), [activeCryptoBench]);
    const toggleCryptoBench = (key) => setActiveCryptoBench(prev => ({ ...prev, [key]: !prev[key] }));

    // Veri çekme
    const { data: rawChartData = [], isLoading, error } = useChartData(
        backendSymbol,
        asset?.assetCategory,
        activeRange,
        customStartDate,
        customEndDate,
        isNone
    );

    // TRY/USD para birimi context'i
    const { currency, convertPrice } = useCurrency();
    const nativeCurrency = useMemo(() => asset?.nativeCurrency || detectNativeCurrency(asset), [asset]);
    const isYield = useMemo(() => isYieldAsset(asset), [asset]);
    // Döviz kurları (USDTRY=X vb.) zaten TL bazlı — toggle ile USD'ye çevirmek anlamsız, conversion uygulama
    const shouldConvert = !isYield && !isCurrency && currency !== nativeCurrency;
    // Y-axis label'ında para birimi göster — döviz için zorla ₺
    const displayCurrency = isCurrency ? 'TRY' : currency;
    const currencySymbol = displayCurrency === 'TRY' ? '₺' : '$';

    // Y-axis / tooltip fiyat formatlayıcısı (₺1.625.000,00 veya $50,000.00)
    const formatPriceLabel = (v) => {
        if (v == null || Number.isNaN(v)) return '';
        const locale = displayCurrency === 'TRY' ? 'tr-TR' : 'en-US';
        const digits = Math.abs(v) < 1 ? 4 : 2;
        return `${currencySymbol}${Number(v).toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
    };

    // Chart data'yı seçilen para birimine çevir (yield bazlı varlıklarda no-op)
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

    // 🆕 BIST overlay data fetch — sadece overlay aktifken + TR hissesi ise
    const activeBistKeys = useMemo(() =>
        BIST_OPTIONS.filter(b => activeBists[b.key]).map(b => b.symbol),
        [activeBists]);

    const { data: bistDataMap = {} } = useQuery({
        queryKey: ['bistOverlay', activeBistKeys.join(','), activeRange, customStartDate, customEndDate],
        queryFn: async () => {
            const results = {};
            await Promise.all(activeBistKeys.map(async (sym) => {
                try {
                    // category='TR_INDEX' → BistIndexChartStrategy yakalayıp Fintables'a gider (Yahoo XU050 vermiyor)
                    const params = activeRange === 'custom'
                        ? { symbol: sym, category: 'TR_INDEX', range: 'custom', interval: '1d', startDate: customStartDate, endDate: customEndDate }
                        : { symbol: sym, category: 'TR_INDEX', range: activeRange, interval: '1d' };
                    const res = await historicalApi.getData(params);
                    const arr = Array.isArray(res) ? res : (res?.priceData || res || []);
                    results[sym] = arr;
                } catch (e) {
                    console.warn(`[BIST OVERLAY] ${sym} fetch hatası:`, e.message);
                    results[sym] = [];
                }
            }));
            return results;
        },
        enabled: hasBistOverlay && isTrStock,
        staleTime: 5 * 60 * 1000
    });

    // 🆕 BIST overlay aktifken: asset + active BIST'leri tek tabloda % normalize edip birleştir
    const bistOverlayChartData = useMemo(() => {
        if (!hasBistOverlay || !rawChartData?.length) return [];

        const dataMap = {};
        const allDates = new Set();

        // Asset serisi (rawChartData kullanılır — % normalize olduğu için currency conversion gereksiz)
        const assetBase = rawChartData[0]?.close || 0;
        if (assetBase > 0) {
            rawChartData.forEach(p => {
                const date = p.dateStr || p.date;
                if (!date) return;
                allDates.add(date);
                if (!dataMap[date]) dataMap[date] = {};
                dataMap[date].asset = Number((((p.close - assetBase) / assetBase) * 100).toFixed(2));
            });
        }

        // BIST serileri — her birini kendi base'ine göre normalize et
        BIST_OPTIONS.forEach(({ key, symbol }) => {
            if (!activeBists[key]) return;
            const points = bistDataMap[symbol] || [];
            if (points.length === 0) return;
            const base = points[0]?.close ?? points[0]?.price ?? 0;
            if (base <= 0) return;
            points.forEach(p => {
                let date = p.date || p.timestamp;
                if (Array.isArray(p.date)) {
                    date = `${p.date[0]}-${String(p.date[1]).padStart(2, '0')}-${String(p.date[2]).padStart(2, '0')}`;
                } else if (typeof date === 'string') {
                    date = date.split('T')[0];
                }
                const close = p.close ?? p.price ?? 0;
                if (!date || close <= 0) return;
                allDates.add(date);
                if (!dataMap[date]) dataMap[date] = {};
                dataMap[date][key] = Number((((close - base) / base) * 100).toFixed(2));
            });
        });

        return Array.from(allDates).sort().map(date => ({ date, ...dataMap[date] }));
    }, [hasBistOverlay, rawChartData, bistDataMap, activeBists]);

    // 🆕 Kripto benchmark fetch — sadece overlay aktifken + kripto ise
    const activeCryptoBenchKeys = useMemo(() =>
        CRYPTO_OPTIONS.filter(b => activeCryptoBench[b.key]).map(b => b.symbol),
        [activeCryptoBench]);

    const { data: cryptoBenchDataMap = {} } = useQuery({
        queryKey: ['cryptoBenchOverlay', activeCryptoBenchKeys.join(','), activeRange, customStartDate, customEndDate],
        queryFn: async () => {
            const results = {};
            await Promise.all(activeCryptoBenchKeys.map(async (sym) => {
                try {
                    // category=INDEX → strategy chain'de match yok, YahooDefaultChartStrategy yakalıyor
                    const params = activeRange === 'custom'
                        ? { symbol: sym, category: 'INDEX', range: 'custom', interval: '1d', startDate: customStartDate, endDate: customEndDate }
                        : { symbol: sym, category: 'INDEX', range: activeRange, interval: '1d' };
                    const res = await historicalApi.getData(params);
                    const arr = Array.isArray(res) ? res : (res?.priceData || res || []);
                    results[sym] = arr;
                } catch (e) {
                    console.warn(`[CRYPTO BENCH] ${sym} fetch hatası:`, e.message);
                    results[sym] = [];
                }
            }));
            return results;
        },
        enabled: hasCryptoOverlay && isCrypto,
        staleTime: 5 * 60 * 1000
    });

    // Kripto için overlay chart data — asset + ^CMC200 % normalize (BIST'in paraleli)
    const cryptoOverlayChartData = useMemo(() => {
        if (!hasCryptoOverlay || !rawChartData?.length) return [];

        const dataMap = {};
        const allDates = new Set();

        const assetBase = rawChartData[0]?.close || 0;
        if (assetBase > 0) {
            rawChartData.forEach(p => {
                const date = p.dateStr || p.date;
                if (!date) return;
                allDates.add(date);
                if (!dataMap[date]) dataMap[date] = {};
                dataMap[date].asset = Number((((p.close - assetBase) / assetBase) * 100).toFixed(2));
            });
        }

        CRYPTO_OPTIONS.forEach(({ key, symbol }) => {
            if (!activeCryptoBench[key]) return;
            const points = cryptoBenchDataMap[symbol] || [];
            if (points.length === 0) return;
            const base = points[0]?.close ?? points[0]?.price ?? 0;
            if (base <= 0) return;
            points.forEach(p => {
                let date = p.date || p.timestamp;
                if (Array.isArray(p.date)) {
                    date = `${p.date[0]}-${String(p.date[1]).padStart(2, '0')}-${String(p.date[2]).padStart(2, '0')}`;
                } else if (typeof date === 'string') {
                    date = date.split('T')[0];
                }
                const close = p.close ?? p.price ?? 0;
                if (!date || close <= 0) return;
                allDates.add(date);
                if (!dataMap[date]) dataMap[date] = {};
                dataMap[date][key] = Number((((close - base) / base) * 100).toFixed(2));
            });
        });

        return Array.from(allDates).sort().map(date => ({ date, ...dataMap[date] }));
    }, [hasCryptoOverlay, rawChartData, cryptoBenchDataMap, activeCryptoBench]);

    // BIST veya kripto overlay aktifken zorla Recharts (multi-area) moduna geç
    const useRechartsFinal = useRecharts || (hasBistOverlay && isTrStock) || (hasCryptoOverlay && isCrypto);
    const showBistChart = hasBistOverlay && isTrStock;
    const showCryptoChart = hasCryptoOverlay && isCrypto;

    // Generic overlay path — BIST veya kripto için tek render bloğu kullanılır
    const showOverlayChart = showBistChart || showCryptoChart;
    const overlayChartData = showBistChart ? bistOverlayChartData : showCryptoChart ? cryptoOverlayChartData : [];
    const overlayBenchmarks = showBistChart
        ? BIST_OPTIONS.filter(b => activeBists[b.key])
        : showCryptoChart
            ? CRYPTO_OPTIONS.filter(b => activeCryptoBench[b.key])
            : [];

    // Hooks — useRechartsFinal'ı geç ki BIST overlay aktifken klinecharts dispose olsun
    const chartInstance = useChartInstance(klineContainer, candleType, useRechartsFinal, isNone);
    const { activeIndicators, toggleIndicator } = useChartIndicators(chartInstance);
    const { editingText, setEditingText, createOverlay, removeAllOverlays, updateTextOverlay } = useChartOverlays(chartInstance);

    // Chart data uygula + fiyat büyüklüğüne göre dinamik precision (PEPE/SHIB gibi düşük fiyatlı coinler için)
    useEffect(() => {
        if (!useRechartsFinal && !isNone && chartInstance.current && chartData.length > 0) {
            const maxPrice = chartData.reduce((m, d) => Math.max(m, d.close || 0, d.high || 0), 0);
            const pricePrecision =
                maxPrice >= 100 ? 2 :
                maxPrice >= 1   ? 4 :
                maxPrice >= 0.01 ? 6 :
                                   8;
            chartInstance.current.setPriceVolumePrecision(pricePrecision, 0);
            chartInstance.current.applyNewData(chartData);
        }
    }, [chartData, useRechartsFinal, isNone, candleType]);

    if (isNone) return <div className="h-125 flex items-center justify-center bg-surface text-text-muted">📊 Desteklenmiyor.</div>;

    return (
        <div className="w-full h-full min-h-150 flex flex-col rounded-xl overflow-hidden bg-surface relative shadow-2xl">
            <ChartHeader
                displayName={displayName} isTrBond={isTrBond} activeRange={activeRange} setActiveRange={setActiveRange}
                isLineChart={useRechartsFinal} chartType={candleType} changeChartType={setCandleType}
                activeIndicators={activeIndicators} toggleIndicator={toggleIndicator}
                customStartDate={customStartDate} setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate} setCustomEndDate={setCustomEndDate}
                handleCustomDateSubmit={() => setActiveRange('custom')}
                disableInteraction={showOverlayChart}
            />

            {/* 🆕 BIST karşılaştırma toggle bar — sadece TR hisseleri için görünür */}
            {isTrStock && (
                <div className="h-11 bg-surface border-b border-border flex items-center px-4 gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted mr-2">{t('bistCompare')}</span>
                    {BIST_OPTIONS.map(b => {
                        const active = activeBists[b.key];
                        return (
                            <button
                                key={b.key}
                                onClick={() => toggleBist(b.key)}
                                className={`px-3 py-1 text-xs font-bold rounded-md border transition-all ${
                                    active
                                        ? 'text-text shadow-lg'
                                        : 'bg-surface-2 hover:bg-surface-hover'
                                }`}
                                style={active ? {
                                    backgroundColor: b.color,
                                    borderColor: b.color,
                                    boxShadow: `0 0 12px ${b.color}55`
                                } : {
                                    color: b.color,
                                    borderColor: `${b.color}66`
                                }}
                            >
                                {b.label}
                            </button>
                        );
                    })}
                    {hasBistOverlay && (
                        <span className="ml-auto text-[10px] text-text-muted italic">
                            {t('bistCompareActive')}
                        </span>
                    )}
                </div>
            )}

            {/* 🆕 Kripto endeks karşılaştırma toggle bar — sadece kriptolar için görünür */}
            {isCrypto && (
                <div className="h-11 bg-surface border-b border-border flex items-center px-4 gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted mr-2">{t('cryptoCompare')}</span>
                    {CRYPTO_OPTIONS.map(b => {
                        const active = activeCryptoBench[b.key];
                        return (
                            <button
                                key={b.key}
                                onClick={() => toggleCryptoBench(b.key)}
                                className={`px-3 py-1 text-xs font-bold rounded-md border transition-all ${
                                    active
                                        ? 'text-text shadow-lg'
                                        : 'bg-surface-2 hover:bg-surface-hover'
                                }`}
                                style={active ? {
                                    backgroundColor: b.color,
                                    borderColor: b.color,
                                    boxShadow: `0 0 12px ${b.color}55`
                                } : {
                                    color: b.color,
                                    borderColor: `${b.color}66`
                                }}
                            >
                                {b.label}
                            </button>
                        );
                    })}
                    {hasCryptoOverlay && (
                        <span className="ml-auto text-[10px] text-text-muted italic">
                            {t('cryptoCompareActive')}
                        </span>
                    )}
                </div>
            )}

            <div className="flex flex-1 overflow-hidden relative">
                {!useRechartsFinal && (
                    <ChartSidebar onDraw={createOverlay} onRemoveAll={removeAllOverlays} />
                )}

                <div className="flex-1 w-full bg-surface relative p-2">
                    <ChartStatusOverlay isLoading={isLoading} error={error} />

                    {showOverlayChart ? (
                        // 🆕 Generic benchmark overlay modu: asset + active benchmark'ler aynı eksende, % normalize.
                        // BIST hisseleri için BIST_OPTIONS, kriptolar için CRYPTO_OPTIONS — pattern aynı, sadece data source farklı.
                        <div key="benchmark-overlay" className="absolute top-2 left-2 right-2 bottom-2 p-4 bg-surface">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={overlayChartData}>
                                    <defs>
                                        <linearGradient id="overlayAssetFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={ASSET_COLOR} stopOpacity={0.35} />
                                            <stop offset="95%" stopColor={ASSET_COLOR} stopOpacity={0} />
                                        </linearGradient>
                                        {overlayBenchmarks.map(b => (
                                            <linearGradient key={b.key} id={`bench-${b.key}-fill`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={b.color} stopOpacity={0.25} />
                                                <stop offset="95%" stopColor={b.color} stopOpacity={0} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                                    <XAxis dataKey="date" stroke="#787b86" tick={{ fontSize: 11 }} minTickGap={40} />
                                    <YAxis stroke="#787b86" orientation="right" tick={{ fontSize: 11 }} domain={['auto', 'auto']} tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39' }}
                                        formatter={(v, name) => [`${v > 0 ? '+' : ''}${Number(v).toFixed(2)}%`, name]}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <ReferenceLine y={0} stroke="#868993" strokeDasharray="3 3" />
                                    <Area
                                        type="monotone" dataKey="asset" name={displayName}
                                        stroke={ASSET_COLOR} strokeWidth={2.5} fillOpacity={1} fill="url(#overlayAssetFill)" connectNulls
                                    />
                                    {overlayBenchmarks.map(b => (
                                        <Area
                                            key={b.key} type="monotone" dataKey={b.key} name={b.label}
                                            stroke={b.color} strokeWidth={2} fillOpacity={1} fill={`url(#bench-${b.key}-fill)`} connectNulls
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : useRecharts ? (
                        <div className="w-full h-full p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                {useAreaChart ? (
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={isEurobond ? '#ff9800' : '#2962ff'} stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor={isEurobond ? '#ff9800' : '#2962ff'} stopOpacity={0.0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                                        <XAxis dataKey="dateStr" stroke="#787b86" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="#787b86" orientation="right" domain={['auto', 'auto']} tickFormatter={(v) => isYield ? `%${v.toFixed(2)}` : formatPriceLabel(v)} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39' }} formatter={(v) => isYield ? [`%${Number(v).toFixed(3)}`, t('yield')] : [formatPriceLabel(v), t('price')]} />
                                        <Area type="monotone" dataKey="close" stroke={isEurobond ? '#ff9800' : '#2962ff'} strokeWidth={3} fillOpacity={1} fill="url(#colorClose)" />
                                    </AreaChart>
                                ) : (
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                                        <XAxis dataKey="dateStr" stroke="#787b86" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="#787b86" orientation="right" tickFormatter={(v) => isYield ? `%${v.toFixed(2)}` : formatPriceLabel(v)} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39' }} formatter={(v) => isYield ? [`%${Number(v).toFixed(3)}`, t('yield')] : [formatPriceLabel(v), t('price')]} />
                                        <Line type="monotone" dataKey="close" stroke="#2962ff" strokeWidth={3} dot={false} />
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div ref={klineContainer} className="w-full h-full absolute inset-0" />
                    )}

                    {editingText && (
                        <input
                            type="text" autoFocus className="absolute bg-surface text-text border border-primary px-2 py-1 z-50 rounded outline-none"
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