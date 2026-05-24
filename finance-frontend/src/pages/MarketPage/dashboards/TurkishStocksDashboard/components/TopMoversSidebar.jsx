import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketData } from '../../../../../hooks/useMarketData.js';
import { useNavigate } from 'react-router-dom';

export default function TopMoversSidebar({ type = 'gainers' }) {
    const { data: stocks, loading: isLoading } = useMarketData('tr-stocks');
    const navigate = useNavigate();

    const isGainers = type === 'gainers';

    const topMovers = useMemo(() => {
        if (!stocks.length) return [];
        const sorted = [...stocks].sort((a, b) => {
            // 🚀 DÜZELTME: price ve changePercent esnek okuma
            const changeA = a.changePercent || a.regularMarketChangePercent || 0;
            const changeB = b.changePercent || b.regularMarketChangePercent || 0;
            return isGainers ? changeB - changeA : changeA - changeB;
        });
        return sorted.slice(0, 5);
    }, [stocks, isGainers]);

    if (isLoading) return <div className="h-64 animate-pulse bg-[#131722] rounded-xl border border-[#2a2e39]"></div>;

    return (
        <div className="bg-[#131722] border border-[#2a2e39] rounded-xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                {isGainers ? <TrendingUp size={18} className="text-[#089981]" /> : <TrendingDown size={18} className="text-[#f23645]" />}
                {isGainers ? 'En Çok Artanlar' : 'En Çok Düşenler'}
            </h3>

            <div className="flex flex-col gap-3">
                {topMovers.map((stock) => {
                    // 🚀 DÜZELTME BURADA
                    const price = stock.price || stock.regularMarketPrice || 0;
                    const changeVal = stock.changePercent || stock.regularMarketChangePercent || 0;
                    const changeStr = changeVal.toFixed(2);
                    const isPositive = changeVal > 0;

                    return (
                        <div
                            key={stock.symbol}
                            onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}?cat=STOCK`)}
                            className="flex items-center justify-between p-3 rounded-lg bg-[#1e222d] border border-[#2a2e39] hover:border-[#2962ff] cursor-pointer transition group"
                        >
                            <div className="flex flex-col">
                                <span className="font-bold text-[#d1d4dc] group-hover:text-white transition">
                                    {stock.symbol.replace('.IS', '')}
                                </span>
                                <span className="text-[10px] text-[#868993] truncate w-24">
                                    {stock.name || 'BIST Hisse'}
                                </span>
                            </div>

                            <div className="flex flex-col items-end">
                                <span className="text-sm font-mono font-bold text-white">
                                    ₺{price.toFixed(2)}
                                </span>
                                <span className={`text-xs font-bold ${isPositive ? 'text-[#089981]' : changeVal < 0 ? 'text-[#f23645]' : 'text-[#868993]'}`}>
                                    {isPositive ? '+' : ''}{changeStr}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}