import React, { useState, useEffect, useRef, useMemo } from 'react'; // useMemo eklendi
import { Plus, X, Loader2, Search, GitCompare, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { useComparisonData } from '../../../hooks/useComparisonData.js';
import { useCurrency } from '../../../context/CurrencyContext';

const COLORS = ['#2962ff', '#f23645', '#089981', '#ff9800', '#9c27b0', '#e91e63'];

export default function ComparisonSection({ asset, baseSymbol }) {
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
                <div className="bg-[#1e222d] border border-[#2a2e39] p-3 rounded-lg shadow-xl">
                    <p className="text-white text-sm mb-2">{label}</p>
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
        <div className="mt-8 bg-[#131722] border border-[#2a2e39] rounded-xl p-4 md:p-6 shadow-2xl relative">
            {/* ... (UI kodların aynı kalabilir, sadece filteredAssets kullanımı güncellendi) ... */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart2 className="text-[#2962ff]" /> Performans Karşılaştırması {isPriceMode ? `(${currencySymbol})` : '(%)'}
                        <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                currency === 'TRY'
                                    ? 'text-[#f23645] border-[#f23645]/40 bg-[#f23645]/10'
                                    : 'text-[#089981] border-[#089981]/40 bg-[#089981]/10'
                            }`}
                            title="Karşılaştırma bu para birimine göre yapılıyor (historical USDTRY çevirisi)"
                        >
                            {currency} cinsinden
                        </span>
                    </h2>

                    <div className="flex items-center gap-2 ml-2">
                        <div className="px-3 py-1 bg-[#2962ff]/20 text-[#2962ff] border border-[#2962ff]/50 rounded-md text-sm font-bold uppercase truncate max-w-[160px]" title={`${primaryYahoo} · ${primaryLabel}`}>
                            {asset?.symbol || primaryYahoo.replace('.IS', '').replace('-USD', '')}
                        </div>

                        {comparisonAssets.map((ast, i) => (
                            <div
                                key={ast.yahooSymbol}
                                className="flex items-center gap-1.5 px-2 py-1 bg-[#2a2e39] text-white rounded-md text-sm cursor-pointer hover:bg-red-500/20 group transition border border-[#2a2e39]"
                                title={`${ast.yahooSymbol} · ${ast.label}`}
                            >
                                <span
                                    style={{ color: COLORS[(i + 1) % COLORS.length] }}
                                    className="font-bold uppercase truncate max-w-[110px]"
                                >
                                    {ast.yahooSymbol || ast.symbol}
                                </span>
                                <X size={14} className="text-[#868993] group-hover:text-red-400" onClick={() => removeAsset(ast.yahooSymbol)} />
                            </div>
                        ))}

                        {!isAdding ? (
                            <button onClick={() => setIsAdding(true)} className="flex items-center gap-1 px-3 py-1 bg-[#1e222d] text-[#868993] hover:text-white border border-[#2a2e39] hover:border-white rounded-md text-sm shadow-sm transition">
                                <Plus size={16} /> Ekle
                            </button>
                        ) : (
                            <div ref={dropdownRef} className="relative z-50">
                                <form onSubmit={handleAddSymbol} className="flex items-center">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#868993]" />
                                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ara (örn: TSLA)" className="w-48 pl-7 pr-2 py-1 bg-[#1e222d] text-white border border-[#2962ff] rounded-l-md outline-none text-sm uppercase" autoFocus />
                                    </div>
                                    <button type="submit" className="px-3 py-1 bg-[#2962ff] text-white hover:bg-blue-600 rounded-r-md text-sm font-medium transition cursor-pointer">Ekle</button>
                                </form>
                                <div className="absolute top-full left-0 mt-1 w-[320px] max-h-72 overflow-y-auto bg-[#1e222d] border border-[#2a2e39] rounded-md shadow-2xl custom-scrollbar">
                                    {!searchQuery && filteredAssets.length > 0 && (
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-[#868993] uppercase tracking-wider bg-[#131722] border-b border-[#2a2e39]">
                                            Popüler Seçimler
                                        </div>
                                    )}
                                    {filteredAssets.length > 0 ? (
                                        filteredAssets.map(ast => (
                                            <div
                                                key={ast.yahooSymbol}
                                                onClick={() => { addAsset(ast); setIsAdding(false); setSearchQuery(''); }}
                                                className="px-3 py-2 text-sm hover:bg-[#2962ff]/20 cursor-pointer transition border-b border-[#2a2e39]/50 last:border-none flex items-center justify-between gap-2 group"
                                                title={`${ast.yahooSymbol} · ${ast.label}`}
                                            >
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="font-bold text-[#d1d4dc] group-hover:text-white truncate">
                                                        {ast.yahooSymbol || ast.symbol}
                                                    </span>
                                                    <span className="text-[10px] text-[#868993] group-hover:text-[#c9cad0] truncate">
                                                        {ast.label || '—'}
                                                    </span>
                                                </div>
                                                {ast.category && ast.category !== 'UNKNOWN' && (
                                                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#2a2e39] text-[#868993] group-hover:bg-[#2962ff] group-hover:text-white shrink-0">
                                                        {ast.category}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-3 text-xs text-[#868993] text-center">
                                            {searchQuery ? "Sonuç bulunamadı." : "Aramak için yazmaya başlayın..."}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* 🆕 Mod toggle — % cumulative değişim vs. mutlak fiyat (log scale) */}
                    <div className="flex items-center bg-[#1e222d] rounded-lg p-1 border border-[#2a2e39]" title="Görüntüleme modu: % değişim mi yoksa mutlak fiyat mı">
                        <button
                            onClick={() => setMode('percent')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                mode === 'percent'
                                    ? 'bg-[#089981] text-white shadow'
                                    : 'text-[#868993] hover:text-white'
                            }`}
                        >
                            % Değişim
                        </button>
                        <button
                            onClick={() => setMode('price')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                mode === 'price'
                                    ? 'bg-[#089981] text-white shadow'
                                    : 'text-[#868993] hover:text-white'
                            }`}
                        >
                            {currencySymbol} Fiyat
                        </button>
                    </div>

                    {/* 🆕 Para birimi toggle grubu — historical USDTRY ile point-by-point conversion */}
                    <div className="flex items-center bg-[#1e222d] rounded-lg p-1 border border-[#2a2e39]" title="Karşılaştırma para birimi (tarihsel USDTRY kuruyla çevirir)">
                        <button
                            onClick={() => setCurrency('TRY')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                currency === 'TRY'
                                    ? 'bg-[#2962ff] text-white shadow'
                                    : 'text-[#868993] hover:text-white'
                            }`}
                        >
                            ₺ TRY
                        </button>
                        <button
                            onClick={() => setCurrency('USD')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                                currency === 'USD'
                                    ? 'bg-[#2962ff] text-white shadow'
                                    : 'text-[#868993] hover:text-white'
                            }`}
                        >
                            $ USD
                        </button>
                    </div>

                    {/* 🆕 Enflasyon overlay toggle'ları — aktif olunca currency otomatik switch */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTrInflation}
                            title="Varlığın getirisini TR enflasyonu (TÜFE) ile karşılaştır — otomatik TRY moduna geçer"
                            className={`px-3 py-1 text-xs font-bold rounded-md transition border ${
                                trInflationActive
                                    ? 'bg-[#f23645] text-white border-[#f23645] shadow-lg shadow-[#f23645]/30'
                                    : 'bg-[#1e222d] text-[#f23645] border-[#f23645]/40 hover:border-[#f23645]'
                            }`}
                        >
                            TR Enflasyon
                        </button>
                        <button
                            onClick={toggleUsdInflation}
                            title="Varlığın getirisini ABD enflasyonu (CPI) ile karşılaştır — otomatik USD moduna geçer"
                            className={`px-3 py-1 text-xs font-bold rounded-md transition border ${
                                usdInflationActive
                                    ? 'bg-[#ff9800] text-white border-[#ff9800] shadow-lg shadow-[#ff9800]/30'
                                    : 'bg-[#1e222d] text-[#ff9800] border-[#ff9800]/40 hover:border-[#ff9800]'
                            }`}
                        >
                            ABD Enflasyon
                        </button>
                    </div>

                    <div className="flex bg-[#1e222d] rounded-lg p-1 border border-[#2a2e39]">
                        {comparisonRanges.map((val) => (
                            <button key={val} onClick={() => setRange(val)} className={`px-3 py-1 text-xs font-medium rounded-md transition ${range === val ? 'bg-[#2a2e39] text-white shadow' : 'text-[#868993] hover:text-white'}`}>
                                {val === 'ytd' ? 'YTD' : val.replace('mo', 'A').replace('y', 'Y')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* GRAFİK KISMI */}
            {allActiveAssets.length > 0 ? (
                <div className="w-full h-[400px] relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#131722]/80 backdrop-blur-sm rounded-lg">
                            <Loader2 size={32} className="text-[#2962ff] animate-spin mb-2" />
                        </div>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                            <XAxis dataKey="date" stroke="#868993" tick={{ fill: '#868993', fontSize: 12 }} tickMargin={10} minTickGap={30} />
                            <YAxis
                                orientation="right"
                                stroke="#868993"
                                tick={{ fill: '#868993', fontSize: 12 }}
                                domain={['auto', 'auto']}
                                scale={isPriceMode ? 'log' : 'linear'}
                                allowDataOverflow={false}
                                tickFormatter={(val) => isPriceMode ? formatPriceLabel(val) : `${val > 0 ? '+' : ''}${val}%`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            {!isPriceMode && <ReferenceLine y={0} stroke="#868993" strokeWidth={1} strokeDasharray="3 3" />}

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
                <div className="w-full h-[200px] flex flex-col items-center justify-center text-[#868993] border-2 border-dashed border-[#2a2e39] rounded-xl">
                    <GitCompare size={48} className="mb-3 opacity-20 text-[#2962ff]" />
                    <p>Karşılaştırma grafiğini görmek için "Ekle" butonuna basarak yeni bir sembol ekleyin.</p>
                </div>
            )}
        </div>
    );
}