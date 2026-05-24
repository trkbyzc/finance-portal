import React, { useState, useMemo } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useMarketData } from '../../../../../hooks/useMarketData.js';
import { useNavigate } from 'react-router-dom';

export default function StockListTable() {
    const { data: stocks, loading: isLoading } = useMarketData('tr-stocks');
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredStocks = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return stocks;
        return stocks.filter(s =>
            (s.symbol && s.symbol.toLowerCase().includes(query)) ||
            (s.name && s.name.toLowerCase().includes(query))
        );
    }, [searchQuery, stocks]);

    if (isLoading) return <div className="h-96 animate-pulse bg-[#1e222d] rounded-lg border border-[#2a2e39]"></div>;

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-white">Tüm Hisse Senetleri</h2>
                <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868993]" />
                    <input
                        type="text"
                        placeholder="Hisse ara (örn: SASA)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#1e222d] border border-[#2a2e39] focus:border-[#2962ff] text-white rounded-lg outline-none text-sm transition"
                    />
                </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar rounded-lg border border-[#2a2e39]">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1e222d] sticky top-0 z-10 shadow-md">
                    <tr>
                        <th className="p-4 text-xs font-bold text-[#868993] uppercase tracking-wider whitespace-nowrap">Sembol / İsim</th>
                        <th className="p-4 text-xs font-bold text-[#868993] uppercase tracking-wider text-right">Son Fiyat</th>
                        <th className="p-4 text-xs font-bold text-[#868993] uppercase tracking-wider text-right">Değişim (%)</th>
                        <th className="p-4"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2e39]">
                    {filteredStocks.length > 0 ? (
                        filteredStocks.map((stock) => {
                            // 🚀 DÜZELTME BURADA
                            const price = stock.price || stock.regularMarketPrice || 0;
                            const change = stock.changePercent || stock.regularMarketChangePercent || 0;
                            const isPositive = change > 0;

                            return (
                                <tr
                                    key={stock.symbol}
                                    onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}?cat=STOCK`)}
                                    className="hover:bg-[#1e222d] transition cursor-pointer group"
                                >
                                    <td className="p-4">
                                        <div className="font-bold text-[#d1d4dc] group-hover:text-white transition">
                                            {stock.symbol.replace('.IS', '')}
                                        </div>
                                        <div className="text-xs text-[#868993] mt-1 max-w-[200px] truncate">
                                            {stock.name || 'BIST Hisse'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono font-medium text-white">
                                        ₺{price.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold text-sm ${isPositive ? 'bg-[#089981]/10 text-[#089981]' : change < 0 ? 'bg-[#f23645]/10 text-[#f23645]' : 'bg-[#2a2e39] text-[#868993]'}`}>
                                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <ChevronRight size={18} className="text-[#868993] group-hover:text-[#2962ff] transition" />
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="4" className="p-8 text-center text-[#868993]">
                                Aramanıza uygun hisse senedi bulunamadı.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}