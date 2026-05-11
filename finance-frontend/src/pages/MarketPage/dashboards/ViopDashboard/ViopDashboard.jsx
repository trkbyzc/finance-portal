import React, { useState, useMemo } from 'react';
import { Search, Zap, ChevronRight, Activity, Clock } from 'lucide-react';
import { useMarketData } from '../../../../hooks/useMarketData';
import { useNavigate } from 'react-router-dom';

export default function ViopDashboard() {
    const { data: contracts, loading: isLoading } = useMarketData('viop');
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    // Arama filtrelemesi
    const filteredContracts = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return contracts;
        return contracts.filter(c =>
            (c.symbol && c.symbol.toLowerCase().includes(query)) ||
            (c.name && c.name.toLowerCase().includes(query))
        );
    }, [searchQuery, contracts]);

    // Anlık İstatistikler
    const stats = useMemo(() => {
        if (!contracts.length) return { total: 0, gainers: 0, losers: 0 };
        const gainers = contracts.filter(c => (c.changePercent || c.regularMarketChangePercent || 0) > 0).length;
        const losers = contracts.filter(c => (c.changePercent || c.regularMarketChangePercent || 0) < 0).length;
        return { total: contracts.length, gainers, losers };
    }, [contracts]);

    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-6 lg:p-10">

            {/* ÜST BAŞLIK */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase text-white tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-[#ff9800] rounded-full"></span>
                        VİOP Piyasası
                    </h1>
                    <p className="text-[#868993] text-sm mt-2 ml-5 flex items-center gap-2">
                        <Zap size={16} className="text-[#ff9800]" /> Vadeli İşlem ve Opsiyon Piyasası Sözleşmeleri
                    </p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868993]" />
                    <input
                        type="text"
                        placeholder="Sözleşme ara (örn: F_XU030)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#131722] border border-[#2a2e39] focus:border-[#ff9800] text-white rounded-xl outline-none text-sm transition shadow-lg"
                    />
                </div>
            </div>

            {/* İSTATİSTİK KARTLARI */}
            {!isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#131722] border border-[#2a2e39] p-5 rounded-xl flex items-center justify-between shadow-lg">
                        <div>
                            <p className="text-[#868993] text-xs font-bold uppercase tracking-wider mb-1">Aktif Sözleşme</p>
                            <h3 className="text-2xl font-black text-white">{stats.total}</h3>
                        </div>
                        <div className="w-12 h-12 bg-[#ff9800]/10 rounded-full flex items-center justify-center text-[#ff9800]">
                            <Clock size={24} />
                        </div>
                    </div>
                    <div className="bg-[#131722] border border-[#2a2e39] p-5 rounded-xl flex items-center justify-between shadow-lg">
                        <div>
                            <p className="text-[#868993] text-xs font-bold uppercase tracking-wider mb-1">Yükselenler</p>
                            <h3 className="text-2xl font-black text-[#089981]">{stats.gainers}</h3>
                        </div>
                        <div className="w-12 h-12 bg-[#089981]/10 rounded-full flex items-center justify-center text-[#089981]">
                            <Activity size={24} />
                        </div>
                    </div>
                    <div className="bg-[#131722] border border-[#2a2e39] p-5 rounded-xl flex items-center justify-between shadow-lg">
                        <div>
                            <p className="text-[#868993] text-xs font-bold uppercase tracking-wider mb-1">Düşenler</p>
                            <h3 className="text-2xl font-black text-[#f23645]">{stats.losers}</h3>
                        </div>
                        <div className="w-12 h-12 bg-[#f23645]/10 rounded-full flex items-center justify-center text-[#f23645]">
                            <Activity size={24} />
                        </div>
                    </div>
                </div>
            )}

            {/* ANA TABLO */}
            {isLoading ? (
                <div className="h-96 animate-pulse bg-[#131722] border border-[#2a2e39] rounded-2xl"></div>
            ) : (
                <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#1e222d] sticky top-0 z-10 shadow-md">
                            <tr>
                                <th className="p-5 text-xs font-bold text-[#868993] uppercase tracking-wider">Sözleşme Kodu</th>
                                <th className="p-5 text-xs font-bold text-[#868993] uppercase tracking-wider text-right">Uzlaşma Fiyatı</th>
                                <th className="p-5 text-xs font-bold text-[#868993] uppercase tracking-wider text-right">Değişim (%)</th>
                                <th className="p-5"></th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2e39]">
                            {filteredContracts.length > 0 ? (
                                filteredContracts.map((contract) => {
                                    const price = contract.price || contract.regularMarketPrice || 0;
                                    const change = contract.changePercent || contract.regularMarketChangePercent || 0;
                                    const isPositive = change > 0;
                                    const isNegative = change < 0;

                                    return (
                                        <tr
                                            key={contract.symbol}
                                            onClick={() => navigate(`/chart/${contract.symbol}`)}
                                            className="hover:bg-[#1e222d] transition cursor-pointer group"
                                        >
                                            <td className="p-5">
                                                <div className="font-bold text-[#d1d4dc] group-hover:text-white transition flex items-center gap-2">
                                                    {contract.symbol}
                                                </div>
                                                <div className="text-[10px] text-[#868993] mt-1 max-w-[250px] truncate uppercase">
                                                    {contract.name || 'VİOP Sözleşmesi'}
                                                </div>
                                            </td>
                                            <td className="p-5 text-right font-mono font-medium text-white">
                                                {price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-sm ${isPositive ? 'bg-[#089981]/10 text-[#089981]' : isNegative ? 'bg-[#f23645]/10 text-[#f23645]' : 'bg-[#2a2e39] text-[#868993]'}`}>
                                                    {isPositive ? '+' : ''}{change.toFixed(2)}%
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <ChevronRight size={18} className="text-[#868993] group-hover:text-[#ff9800] transition" />
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center text-[#868993]">
                                        Sözleşme bulunamadı.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}