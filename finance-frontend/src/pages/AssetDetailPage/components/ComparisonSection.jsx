import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, X, Loader2, Search, GitCompare, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useComparisonData } from '../../../hooks/useComparisonData.js';
import { useCurrency } from '../../../context/CurrencyContext';

const COLORS = ['#2962ff', '#f23645', '#089981', '#ff9800', '#9c27b0', '#e91e63'];

export default function ComparisonSection({ asset, baseSymbol }) {
    const { t } = useTranslation(['asset', 'common', 'charts']);
    // 🚀 1. Memoization: Prop'ları sabitle. asset değişmediği sürece bu değerler değişmez.
    const { primaryYahoo, primaryLabel, isTrBond, primaryCategory } = useMemo(() => {
        const actualAsset = asset || { yahooSymbol: baseSymbol, name: baseSymbol, symbol: baseSymbol };
        const yahoo = actualAsset.yahooSymbol || actualAsset.symbol || actualAsset.currencyCode || 'XU100.IS';
        const label = actualAsset.name || actualAsset.currencyName || yahoo;
        const bond = yahoo.startsWith('TP.');
        // Kategoriyi yakalıyoruz (yoksa UNKNOWN)
        const category = actualAsset.assetCategory || actualAsset.category || 'UNKNOWN';

        return { primaryYahoo: yahoo, primaryLabel: label, isTrBond: bond, primaryCategory: category };
    }, [asset, baseSymbol]);

    // 🚀 Hook'u sabitlenmiş değerlerle çağır
    const {
        comparisonAssets, addAsset, removeAsset,
        allAssets, chartData, isLoading, range, setRange, allActiveAssets,
        trInflationActive, usdInflationActive, toggleTrInflation, toggleUsdInflation,
        inflationSeries, mode, setMode
    } = useComparisonData(primaryYahoo, primaryLabel, asset?.symbol || baseSymbol, isTrBond, primaryCategory);

    // Global currency context — TRY/USD toggle buton grubu için
    const { currency, setCurrency } = useCurrency();

    const isPriceMode = mode === 'price';
    const currencySymbol = currency === 'TRY' ? '₺' : '$';

    const formatPriceLabel = (v) => {
        if (v == null || Number.isNaN(v)) return '';
        const abs = Math.abs(v);
        const locale = currency === 'TRY' ? 'tr-TR' : 'en-US';
        // Büyük sayılar için kısa format (M, B, K)
        if (abs >= 1_000_000) return `${currencySymbol}${(v / 1_000_000).toFixed(2)}M`;
        if (abs >= 1_000) return `${currencySymbol}${(v / 1_000).toFixed(1)}K`;
        const digits = abs < 1 ? 4 : 2;
        return `${currencySymbol}${Number(v).toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
    };

    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);

    // 🚀 2. Arama filtresi: allAssets'in değişimine karşı önlem
    const filteredAssets = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) {
            const popularSymbols = ['XU100.IS', 'USD', 'GC=F', 'BTC-USD', 'THYAO.IS', 'AAPL'];
            return allAssets.filter(a =>
                popularSymbols.includes(a.symbol.toUpperCase()) &&
                a.yahooSymbol !== primaryYahoo &&
                !comparisonAssets.some(c => c.yahooSymbol === a.yahooSymbol)
            );
        }
        return allAssets.filter(a =>
            (a.label.toLowerCase().includes(query) || a.symbol.toLowerCase().includes(query)) &&
            a.yahooSymbol !== primaryYahoo &&
            !comparisonAssets.some(c => c.yahooSymbol === a.yahooSymbol)
        ).slice(0, 30);
    }, [searchQuery, allAssets, primaryYahoo, comparisonAssets]);

    useEffect(() => {
        const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsAdding(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddSymbol = (e) => {
        e.preventDefault();
        const query = searchQuery.trim().toUpperCase();
        if (!query) return;
        const found = allAssets.find(a => a.symbol.toUpperCase() === query || a.yahooSymbol.toUpperCase() === query);
        addAsset(found || { label: query, symbol: query, yahooSymbol: query });
        setSearchQuery('');
        setIsAdding(false);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-surface-2 border border-border p-3 rounded-lg shadow-xl">
                    <p className="text-text text-sm mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm font-medium" style={{ color: entry.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            <span className="truncate max-w-[150px]">{entry.name}:</span>
                            <span>
                                {isPriceMode
                                    ? formatPriceLabel(entry.value)
                                    : `${entry.value > 0 ? '+' : ''}${entry.value}%`}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const comparisonRanges = isTrBond ? ['ytd'] : ['1mo', '3mo', '6mo', '1y', '5y'];

    return (
        <div className="mt-8 bg-surface border border-border rounded-xl p-4 md:p-6 shadow-2xl relative">
            {/* ... (UI kodların aynı kalabilir, sadece filteredAssets kullanımı güncellendi) ... */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-text flex items-center gap-2">
                        <BarChart2 className="text-primary" /> {t('asset:comparison.title')} {isPriceMode ? `(${currencySymbol})` : '(%)'}
                        <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                currency === 'TRY'
                                    ? 'text-sell border-sell/40 bg-sell/10'
                                    : 'text-buy border-buy/40 bg-buy/10'
                            }`}
                        >
                            {currency}
                        </span>
                    </h2>

                    <div className="flex items-center gap-2 ml-2">
                        <div className="px-3 py-1 bg-primary/20 text-primary border border-primary/50 rounded-md text-sm font-bold uppercase truncate max-w-40" title={`${primaryYahoo} · ${primaryLabel}`}>
                            {asset?.symbol || primaryYahoo.replace('.IS', '').replace('-USD', '')}
                        </div>

                        {comparisonAssets.map((ast, i) => (
                            <div
                                key={ast.yahooSymbol}
                                className="flex items-center gap-1.5 px-2 py-1 bg-surface-hover text-text rounded-md text-sm cursor-pointer hover:bg-sell/20 group transition border border-border"
                                title={`${ast.yahooSymbol} · ${ast.label}`}
                            >
                                <span
                                    style={{ color: COLORS[(i + 1) % COLORS.length] }}
                                    className="font-bold uppercase truncate max-w-28"
                                >
                                    {ast.yahooSymbol || ast.symbol}
                                </span>
                                <X size={14} className="text-text-muted group-hover:text-sell" onClick={() => removeAsset(ast.yahooSymbol)} />
                            </div>
                        ))}

                        {!isAdding ? (
                            <button onClick={() => setIsAdding(true)} className="flex items-center gap-1 px-3 py-1 bg-surface-2 text-text-muted hover:text-text border border-border hover:border-border-strong rounded-md text-sm shadow-sm transition">
                                <Plus size={16} /> {t('common:actions.add')}
                            </button>
                        ) : (
                            <div ref={dropdownRef} className="relative z-50">
                                <form onSubmit={handleAddSymbol} className="flex items-center">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('common:actions.search')} className="w-48 pl-7 pr-2 py-1 bg-surface-2 text-text border border-primary rounded-l-md outline-none text-sm uppercase" autoFocus />
                                    </div>
                                    <button type="submit" className="px-3 py-1 bg-primary text-text hover:bg-primary-hover rounded-r-md text-sm font-medium transition cursor-pointer">{t('common:actions.add')}</button>
                                </form>
                                <div className="absolute top-full left-0 mt-1 w-80 max-h-72 overflow-y-auto bg-surface-2 border border-border rounded-md shadow-2xl custom-scrollbar">
                                    {!searchQuery && filteredAssets.length > 0 && (
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider bg-surface border-b border-border">
                                            {t('common:actions.viewMore')}
                                        </div>
                                    )}
                                    {filteredAssets.length > 0 ? (
                                        filteredAssets.map(ast => (
                                            <div
                                                key={ast.yahooSymbol}
                                                onClick={() => { addAsset(ast); setIsAdding(false); setSearchQuery(''); }}
                                                className="px-3 py-2 text-sm hover:bg-primary/20 cursor-pointer transition border-b border-border/50 last:border-none flex items-center justify-between gap-2 group"
                                                title={`${ast.yahooSymbol} · ${ast.label}`}
                                            >
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="font-bold text-text group-hover:text-text truncate">
                                                        {ast.yahooSymbol || ast.symbol}
                                                    </span>
                                                    <span className="text-[10px] text-text-muted group-hover:text-text truncate">
                                                        {ast.label || '—'}
                                                    </span>
                                                </div>
                                                {ast.category && ast.category !== 'UNKNOWN' && (
                                                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-surface-hover text-text-muted group-hover:bg-primary group-hover:text-text shrink-0">
                                                        {ast.category}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-3 text-xs text-text-muted text-center">
                                            {searchQuery ? t('common:status.noResults') : t('common:actions.search') + '...'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center bg-surface-2 rounded-lg p-1 border border-border">
                        <button
                            onClick={() => setMode('percent')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                mode === 'percent'
                                    ? 'bg-buy text-text shadow'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            % {t('common:labels.change')}
                        </button>
                        <button
                            onClick={() => setMode('price')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                mode === 'price'
                                    ? 'bg-buy text-text shadow'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            {currencySymbol} {t('common:labels.price')}
                        </button>
                    </div>

                    <div className="flex items-center bg-surface-2 rounded-lg p-1 border border-border">
                        <button
                            onClick={() => setCurrency('TRY')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                currency === 'TRY'
                                    ? 'bg-primary text-text shadow'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            ₺ TRY
                        </button>
                        <button
                            onClick={() => setCurrency('USD')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                currency === 'USD'
                                    ? 'bg-primary text-text shadow'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            $ USD
                        </button>
                    </div>

                    {/* 🆕 Enflasyon overlay toggle'ları — aktif olunca currency otomatik switch */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTrInflation}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition border ${
                                trInflationActive
                                    ? 'bg-sell text-text border-sell shadow-lg shadow-sell/30'
                                    : 'bg-surface-2 text-sell border-sell/40 hover:border-sell'
                            }`}
                        >
                            {t('charts:trInflation')}
                        </button>
                        <button
                            onClick={toggleUsdInflation}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition border ${
                                usdInflationActive
                                    ? 'bg-warning text-text border-warning shadow-lg shadow-warning/30'
                                    : 'bg-surface-2 text-warning border-warning/40 hover:border-warning'
                            }`}
                        >
                            {t('charts:usInflation')}
                        </button>
                    </div>

                    <div className="flex bg-surface-2 rounded-lg p-1 border border-border">
                        {comparisonRanges.map((val) => (
                            <button key={val} onClick={() => setRange(val)} className={`px-3 py-1 text-xs font-medium rounded-md transition ${range === val ? 'bg-surface-hover text-text shadow' : 'text-text-muted hover:text-text'}`}>
                                {val === 'ytd' ? 'YTD' : val.replace('mo', 'A').replace('y', 'Y')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* GRAFİK KISMI */}
            {allActiveAssets.length > 0 ? (
                <div className="w-full h-100 relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 backdrop-blur-sm rounded-lg">
                            <Loader2 size={32} className="text-primary animate-spin mb-2" />
                        </div>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} vertical={false} />
                            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickMargin={10} minTickGap={30} />
                            <YAxis
                                orientation="right"
                                stroke="#94a3b8"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                domain={['auto', 'auto']}
                                scale={isPriceMode ? 'log' : 'linear'}
                                allowDataOverflow={false}
                                tickFormatter={(val) => isPriceMode ? formatPriceLabel(val) : `${val > 0 ? '+' : ''}${val}%`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            {!isPriceMode && <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />}

                            {allActiveAssets.map((ast, i) => (
                                <Line key={ast.yahooSymbol} type="monotone" dataKey={ast.label} name={ast.label} stroke={COLORS[i % COLORS.length]} strokeWidth={i === 0 ? 2.5 : 2} dot={false} activeDot={i === 0 ? { r: 6 } : false} connectNulls={true} />
                            ))}
                            {/* 🆕 Enflasyon overlay'leri — kesik çizgi ile varlıklardan ayrılır */}
                            {inflationSeries.map(s => (
                                <Line
                                    key={s.label}
                                    type="monotone"
                                    dataKey={s.label}
                                    name={s.label}
                                    stroke={s.color}
                                    strokeWidth={2}
                                    strokeDasharray="6 4"
                                    dot={false}
                                    connectNulls={true}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="w-full h-50 flex flex-col items-center justify-center text-text-muted border-2 border-dashed border-border rounded-xl">
                    <GitCompare size={48} className="mb-3 opacity-20 text-primary" />
                    <p>{t('asset:comparison.noComparison')}</p>
                </div>
            )}
        </div>
    );
}