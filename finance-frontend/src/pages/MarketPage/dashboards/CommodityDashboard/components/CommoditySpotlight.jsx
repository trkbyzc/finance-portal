import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber } from '../../../../../utils/formatters/numberFormatter';

export default function CommoditySpotlight({ items, loading, show }) {
    const navigate = useNavigate();
    if (loading || !show || items.length === 0) return null;

    const getTheme = (code) => {
        if (code.includes('GA')) return { bg: 'from-warning/20', border: 'border-warning', text: 'text-warning', icon: '🌕' };
        if (code.includes('GAG') || code.includes('XAG')) return { bg: 'from-text-muted/20', border: 'border-border-strong', text: 'text-text-muted', icon: '🥈' };
        return { bg: 'from-warning/20', border: 'border-warning', text: 'text-warning', icon: '📦' };
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
                        className={`bg-linear-to-br ${theme.bg} to-transparent border ${theme.border} rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-all group`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-3xl">{theme.icon}</span>
                            <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-buy' : 'text-sell'}`}>
                                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                %{Math.abs(change).toFixed(2)}
                            </div>
                        </div>
                        <h3 className="text-sm font-bold text-text-muted uppercase mb-1">{item.currencyName}</h3>
                        <div className="text-2xl font-black text-text">
                            ₺{formatNumber(item.forexBuying || 0)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
