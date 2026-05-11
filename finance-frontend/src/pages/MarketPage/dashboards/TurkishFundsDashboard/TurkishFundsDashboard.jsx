import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketData } from '../../../../hooks/useMarketData';
// 🚀 Senin yazdığın efsane chart bileşenini import ediyoruz
import FundTradingChart from '../../../../components/charts/FundTradingChart/FundTradingChart';

export default function TurkishFundsDashboard() {
    const navigate = useNavigate();
    const { data: funds, selectedAsset, setSelectedAsset, loading } = useMarketData('tr-funds');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 100;

    // Arama filtrelemesi
    const filteredFunds = useMemo(() => {
        if (!funds) return [];
        let result = funds;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(f =>
                (f.name || f.currencyName || '').toLowerCase().includes(q) ||
                (f.symbol || f.currencyCode || '').toLowerCase().includes(q)
            );
            setCurrentPage(1); // Arama yapınca 1. sayfaya dön
        }
        return result;
    }, [funds, searchQuery]);

    // Sayfalama (Pagination) Mantığı
    const totalPages = Math.ceil(filteredFunds.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredFunds.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    if (loading) return <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-6 lg:p-10">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#868993] hover:text-white mb-6 transition bg-[#1e222d] px-4 py-2 rounded-lg border border-[#2a2e39]">
                <ArrowLeft size={18} /> Geri Dön
            </button>

            <div className="mb-8 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
                    <Wallet size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Türkiye Yatırım Fonları (TEFAS)</h1>
                    <p className="text-[#868993] text-sm mt-1">2417+ Fonun güncel fiyatları ve analizleri</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* SOL: SENİN ATTIĞIN FUND CHART */}
                <div className="xl:col-span-2 h-[650px] shadow-2xl">
                    {selectedAsset ? (
                        <FundTradingChart asset={selectedAsset} />
                    ) : (
                        <div className="w-full h-full bg-[#131722] rounded-2xl border border-[#2a2e39] flex items-center justify-center text-[#868993]">Lütfen sağdaki listeden bir fon seçin.</div>
                    )}
                </div>

                {/* SAĞ: ARAMA VE SAYFALAMALI LİSTE */}
                <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl p-5 shadow-2xl flex flex-col h-[650px]">
                    <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868993]" />
                        <input
                            type="text"
                            placeholder="Fon Kodu veya Adı Ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-[#1e222d] border border-[#2a2e39] text-white rounded-xl outline-none focus:border-[#10b981] transition text-sm"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-[#131722] z-10">
                            <tr className="text-[#868993] text-[10px] uppercase border-b border-[#2a2e39]">
                                <th className="pb-2 font-bold">Fon</th>
                                {/* 🚀 BAŞLIK DEĞİŞTİ: Fiyat yerine Getiri */}
                                <th className="pb-2 font-bold text-right">Aylık Getiri</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentItems.map((item, i) => {
                                const code = item.symbol || item.currencyCode;
                                const isSelected = selectedAsset && (selectedAsset.symbol === code || selectedAsset.currencyCode === code);

                                // 🚀 GETİRİ ORANINI YAKALIYORUZ
                                const change = item.changePercent || 0;
                                const isPositive = change >= 0;

                                return (
                                    <tr key={i} onClick={() => setSelectedAsset(item)} className={`border-b border-[#2a2e39]/50 cursor-pointer group ${isSelected ? 'bg-[#10b981]/10' : 'hover:bg-[#1e222d]'}`}>
                                        <td className="py-3">
                                            <div className={`font-bold text-xs ${isSelected ? 'text-[#10b981]' : 'text-[#d1d4dc] group-hover:text-white'}`}>{code}</div>
                                            <div className="text-[9px] text-[#868993] truncate max-w-[180px]">{item.name || item.currencyName}</div>
                                        </td>
                                        <td className="py-3 text-right font-mono text-xs font-bold">
                                            {/* 🚀 FİYAT YERİNE RENKLİ GETİRİ ORANI BASILIYOR */}
                                            <span className={isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}>
                                                    {isPositive ? '+' : ''}{Number(change).toFixed(2)}%
                                                </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION (SAYFALAMA) KONTROLLERİ */}
                    {totalPages > 1 && (
                        <div className="mt-4 pt-4 border-t border-[#2a2e39] flex items-center justify-between">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1 rounded bg-[#1e222d] text-[#868993] disabled:opacity-50 hover:text-white border border-[#2a2e39]">
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-[#868993] text-xs font-bold">Sayfa {currentPage} / {totalPages}</span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1 rounded bg-[#1e222d] text-[#868993] disabled:opacity-50 hover:text-white border border-[#2a2e39]">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}