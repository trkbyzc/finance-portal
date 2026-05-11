import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Loader2, Search, GitCompare, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { useComparisonData } from '../../../hooks/useComparisonData.js';

const COLORS = ['#2962ff', '#f23645', '#089981', '#ff9800', '#9c27b0', '#e91e63'];

export default function ComparisonSection({ asset, baseSymbol }) {
    const actualAsset = asset || { yahooSymbol: baseSymbol, name: baseSymbol, symbol: baseSymbol };
    const primaryYahoo = actualAsset.yahooSymbol || actualAsset.symbol || actualAsset.currencyCode || 'XU100.IS';
    const primaryLabel = actualAsset.name || actualAsset.currencyName || primaryYahoo;
    const isTrBond = primaryYahoo.startsWith('TP.');

    const {
        comparisonAssets, addAsset, removeAsset,
        allAssets, chartData, isLoading, range, setRange, allActiveAssets
    } = useComparisonData(primaryYahoo, primaryLabel, actualAsset.symbol, isTrBond);

    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredAssets, setFilteredAssets] = useState([]);
    const dropdownRef = useRef(null);

    // 🚀 AKILLI ARAMA (SMART DROPDOWN) MANTIĞI
    useEffect(() => {
        const query = searchQuery.toLowerCase().trim();

        // 1. DURUM: Kullanıcı henüz bir şey yazmadıysa "Popüler Seçimler"i göster
        if (!query) {
            const popularSymbols = ['XU100.IS', 'USD', 'GC=F', 'BTC-USD', 'THYAO.IS', 'AAPL'];
            const popularAssets = allAssets.filter(a =>
                popularSymbols.includes(a.symbol.toUpperCase()) &&
                a.yahooSymbol !== primaryYahoo &&
                !comparisonAssets.some(c => c.yahooSymbol === a.yahooSymbol)
            );
            setFilteredAssets(popularAssets);
            return;
        }

        // 2. DURUM: Kullanıcı yazmaya başladıysa, tüm dünyada ara ve ilk 30'u getir (Performans için)
        setFilteredAssets(
            allAssets.filter(a =>
                (a.label.toLowerCase().includes(query) || a.symbol.toLowerCase().includes(query)) &&
                a.yahooSymbol !== primaryYahoo &&
                !comparisonAssets.some(c => c.yahooSymbol === a.yahooSymbol)
            ).slice(0, 30)
        );
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
                            <span>{entry.value > 0 ? '+' : ''}{entry.value}%</span>
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart2 className="text-[#2962ff]" /> Performans Karşılaştırması (%)
                    </h2>

                    <div className="flex items-center gap-2 ml-2">
                        <div className="px-3 py-1 bg-[#2962ff]/20 text-[#2962ff] border border-[#2962ff]/50 rounded-md text-sm font-bold uppercase truncate max-w-[150px]" title={primaryLabel}>
                            {actualAsset.symbol || primaryYahoo.replace('.IS', '').replace('-USD', '')}
                        </div>

                        {comparisonAssets.map((ast, i) => (
                            <div key={ast.yahooSymbol} className="flex items-center gap-1 px-2 py-1 bg-[#2a2e39] text-white rounded-md text-sm cursor-pointer hover:bg-red-500/20 group transition border border-[#2a2e39]" title={ast.label}>
                                <span style={{ color: COLORS[(i + 1) % COLORS.length] }} className="font-bold uppercase truncate max-w-[100px]">{ast.symbol.replace('.IS', '').replace('-USD', '')}</span>
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
                                <div className="absolute top-full left-0 mt-1 w-[250px] max-h-56 overflow-y-auto bg-[#1e222d] border border-[#2a2e39] rounded-md shadow-2xl custom-scrollbar">

                                    {/* 🚀 EĞER ARAMA BOŞSA POPÜLER BAŞLIĞI KOY */}
                                    {!searchQuery && filteredAssets.length > 0 && (
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-[#868993] uppercase tracking-wider bg-[#131722] border-b border-[#2a2e39]">
                                            Popüler Seçimler
                                        </div>
                                    )}

                                    {filteredAssets.length > 0 ? (
                                        filteredAssets.map(ast => (
                                            <div key={ast.yahooSymbol} onClick={() => { addAsset(ast); setIsAdding(false); setSearchQuery(''); }} className="px-3 py-2 text-sm text-[#868993] hover:text-white hover:bg-[#2962ff] cursor-pointer transition border-b border-[#2a2e39]/50 last:border-none flex justify-between items-center group">
                                                <span className="font-bold text-[#d1d4dc] group-hover:text-white">{ast.symbol.replace('.IS', '')}</span>
                                                <span className="text-[10px] truncate w-24 text-right opacity-70">{ast.label}</span>
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

                <div className="flex bg-[#1e222d] rounded-lg p-1 border border-[#2a2e39]">
                    {comparisonRanges.map((val) => (
                        <button key={val} onClick={() => setRange(val)} className={`px-3 py-1 text-xs font-medium rounded-md transition ${range === val ? 'bg-[#2a2e39] text-white shadow' : 'text-[#868993] hover:text-white'}`}>
                            {val === 'ytd' ? 'YTD' : val.replace('mo', 'A').replace('y', 'Y')}
                        </button>
                    ))}
                </div>
            </div>

            {allActiveAssets.length > 1 ? (
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
                            <YAxis orientation="right" stroke="#868993" tick={{ fill: '#868993', fontSize: 12 }} domain={['auto', 'auto']} tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}%`} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={0} stroke="#868993" strokeWidth={1} strokeDasharray="3 3" />

                            {allActiveAssets.map((ast, i) => (
                                <Line key={ast.yahooSymbol} type="monotone" dataKey={ast.label} name={ast.label} stroke={COLORS[i % COLORS.length]} strokeWidth={i === 0 ? 2.5 : 2} dot={false} activeDot={i === 0 ? { r: 6 } : false} connectNulls={true} />
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