import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Layers } from 'lucide-react';

export default function CommoditySpotlight({ items, loading, show }) {
    const navigate = useNavigate();
    if (loading || !show || items.length === 0) return null;

    const getTheme = (code) => {
        if (code.includes('GA')) return { bg: 'from-[#fbbf24]/20', border: 'border-[#fbbf24]', text: 'text-[#fbbf24]', icon: '🌕' };
        if (code.includes('GAG') || code.includes('XAG')) return { bg: 'from-[#9ca3af]/20', border: 'border-[#9ca3af]', text: 'text-[#9ca3af]', icon: '🥈' };
        return { bg: 'from-[#d97706]/20', border: 'border-[#d97706]', text: 'text-[#d97706]', icon: '📦' };
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {items.map(item => {
                const theme = getTheme(item.currencyCode);
                const change = item.changePercent || 0;
                const isPositive = change >= 0;

                return (
                    <div
                        key={item.currencyCode}
                        onClick={() => navigate(`/chart/${encodeURIComponent(item.currencyCode)}?cat=COMMODITY`)}
                        className={`bg-gradient-to-br ${theme.bg} to-transparent border ${theme.border} rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-all group`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-3xl">{theme.icon}</span>
                            <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                %{Math.abs(change).toFixed(2)}
                            </div>
                        </div>
                        <h3 className="text-sm font-bold text-[#868993] uppercase mb-1">{item.currencyName}</h3>
                        <div className="text-2xl font-black text-white">
                            ₺{Number(item.forexBuying || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}