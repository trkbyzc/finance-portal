import React, { useState, useMemo } from 'react';
import { Search, Globe, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { useMarketData } from '../../../../hooks/useMarketData';
import { useNavigate } from 'react-router-dom';

export default function UsStocksDashboard() {
    const { data: stocks, loading: isLoading } = useMarketData('us-stocks');
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    // Arama filtrelemesi
    const filteredStocks = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return stocks;
        return stocks.filter(s =>
            (s.symbol && s.symbol.toLowerCase().includes(query)) ||
            (s.name && s.name.toLowerCase().includes(query))
        );
    }, [searchQuery, stocks]);

    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-6 lg:p-10">

            {/* ÜST BAŞLIK VE ARAMA ÇUBUĞU */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black uppercase text-white tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-[#2962ff] rounded-full"></span>
                        Wall Street (ABD Hisseleri)
                    </h1>
                    <p className="text-[#868993] text-sm mt-2 ml-5 flex items-center gap-2">
                        <Globe size={16} /> Dünyanın en büyük teknoloji ve endüstri devleri.
                    </p>
                </div>

                {/* Arama Çubuğu */}
                <div className="relative w-full md:w-72">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868993]" />
                    <input
                        type="text"
                        placeholder="Hisse ara (örn: AAPL, TSLA)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#131722] border border-[#2a2e39] focus:border-[#2962ff] text-white rounded-xl outline-none text-sm transition shadow-lg"
                    />
                </div>
            </div>

            {/* YÜKLENİYOR İSKELETİ */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-40 animate-pulse bg-[#131722] border border-[#2a2e39] rounded-2xl"></div>
                    ))}
                </div>
            ) : (
                /* PREMIUM KART IZGARASI (GRID) */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredStocks.length > 0 ? (
                        filteredStocks.map((stock) => {
                            const price = stock.price || stock.regularMarketPrice || 0;
                            const change = stock.changePercent || stock.regularMarketChangePercent || 0;
                            const isPositive = change > 0;
                            const isNegative = change < 0;

                            return (
                                <div
                                    key={stock.symbol}
                                    onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}?cat=STOCK`)}
                                    className="bg-[#131722] border border-[#2a2e39] rounded-2xl p-6 hover:border-[#2962ff] hover:shadow-[0_0_20px_rgba(41,98,255,0.1)] transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    {/* Arkaplan Şovu */}
                                    <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${isPositive ? 'bg-[#089981]' : isNegative ? 'bg-[#f23645]' : 'bg-[#2962ff]'}`}></div>

                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div>
                                            <h3 className="text-xl font-black text-white group-hover:text-[#2962ff] transition">
                                                {stock.symbol.replace('-USD', '')}
                                            </h3>
                                            <p className="text-xs text-[#868993] mt-1 max-w-[150px] truncate">
                                                {stock.name || 'ABD Hisse Senedi'}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-[#1e222d] border border-[#2a2e39] flex items-center justify-center text-[#868993] group-hover:text-white transition shadow-sm">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between mt-6 relative z-10">
                                        <div className="flex flex-col">
                                            <span className="text-[#868993] text-[10px] font-bold uppercase tracking-wider mb-1">Son Fiyat</span>
                                            <span className="text-2xl font-mono font-bold text-white">
                                                ${price.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-sm ${isPositive ? 'bg-[#089981]/10 text-[#089981]' : isNegative ? 'bg-[#f23645]/10 text-[#f23645]' : 'bg-[#2a2e39] text-[#868993]'}`}>
                                            {isPositive ? <TrendingUp size={14} /> : isNegative ? <TrendingDown size={14} /> : null}
                                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-[#868993] bg-[#131722] border border-[#2a2e39] rounded-2xl border-dashed">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p className="text-lg">Aramanıza uygun hisse senedi bulunamadı.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}