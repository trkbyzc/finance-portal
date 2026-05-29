import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../../../../../hooks/useMarketData.js';
import { useNavigate } from 'react-router-dom';
import MiniSparkline from './MiniSparkline';

const SPARK_GREEN = '#22c55e';
const SPARK_RED = '#ef4444';

export default function TopMoversSidebar({ type = 'gainers' }) {
    const { data: stocks, loading: isLoading } = useMarketData('tr-stocks');
    const navigate = useNavigate();
    const { t } = useTranslation('markets');

    const isGainers = type === 'gainers';

    const topMovers = useMemo(() => {
        if (!stocks.length) return [];
        const sorted = [...stocks].sort((a, b) => {
            const changeA = a.changePercent || a.regularMarketChangePercent || 0;
            const changeB = b.changePercent || b.regularMarketChangePercent || 0;
            return isGainers ? changeB - changeA : changeA - changeB;
        });
        return sorted.slice(0, 4);
    }, [stocks, isGainers]);

    if (isLoading) return <div className="h-64 animate-pulse bg-surface rounded-xl border border-border" />;

    const sparkColor = isGainers ? SPARK_GREEN : SPARK_RED;

    return (
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider mb-4 flex items-center gap-2">
                {isGainers ? <TrendingUp size={18} className="text-buy" /> : <TrendingDown size={18} className="text-sell" />}
                {isGainers ? t('stocks.topGainers') : t('stocks.topLosers')}
            </h3>

            <div className="flex flex-col gap-3">
                {topMovers.map((stock) => {
                    const price = stock.price || stock.regularMarketPrice || 0;
                    const changeVal = stock.changePercent || stock.regularMarketChangePercent || 0;
                    const isPositive = changeVal > 0;

                    return (
                        <div
                            key={stock.symbol}
                            onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}?cat=STOCK`)}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-surface-2 border border-border hover:border-primary cursor-pointer transition group"
                        >
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold text-text text-sm group-hover:text-primary transition">
                                    {stock.symbol.replace('.IS', '')}
                                </span>
                                <span className="text-[10px] text-text-muted truncate max-w-25">
                                    {stock.name || ''}
                                </span>
                            </div>

                            <div className="shrink-0">
                                <MiniSparkline symbol={stock.symbol} color={sparkColor} width={70} height={28} />
                            </div>

                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-xs font-mono font-bold text-text">
                                    ₺{price.toFixed(2)}
                                </span>
                                <span className={`text-[11px] font-bold ${isPositive ? 'text-buy' : changeVal < 0 ? 'text-sell' : 'text-text-muted'}`}>
                                    {isPositive ? '+' : ''}{changeVal.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
