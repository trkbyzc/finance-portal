import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../../../../../hooks/useMarketData.js';
import { useNavigate } from 'react-router-dom';
import MiniSparkline from './MiniSparkline';

const SPARK_GREEN = '#22c55e';
const SPARK_RED = '#ef4444';

/**
 * Top Gainers / Top Losers sidebar — 5 hisse, Stitch tasarımına göre tek satır:
 *   {SYMBOL (Name)} | sparkline | ₺price (+%change)
 *
 * Şirket adı sembol yanında parantezli + küçük; sparkline ortada (yeşil/kırmızı);
 * fiyat ve % aynı satırda parantezli compact.
 */
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
        return sorted.slice(0, 5);
    }, [stocks, isGainers]);

    if (isLoading) return <div className="h-64 animate-pulse bg-surface rounded-xl border border-border" />;

    const sparkColor = isGainers ? SPARK_GREEN : SPARK_RED;

    return (
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider mb-4 flex items-center gap-2">
                {isGainers ? <TrendingUp size={18} className="text-buy" /> : <TrendingDown size={18} className="text-sell" />}
                {isGainers ? t('stocks.topGainers') : t('stocks.topLosers')}
            </h3>

            <div className="flex flex-col gap-2.5">
                {topMovers.map((stock) => {
                    const price = stock.price || stock.regularMarketPrice || 0;
                    const changeVal = stock.changePercent || stock.regularMarketChangePercent || 0;
                    const isPositive = changeVal > 0;
                    const sym = stock.symbol.replace('.IS', '');
                    const changeColor = isPositive ? 'text-buy' : changeVal < 0 ? 'text-sell' : 'text-text-muted';

                    return (
                        <div
                            key={stock.symbol}
                            onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}?cat=STOCK`)}
                            className="flex items-center justify-between gap-2 cursor-pointer group"
                        >
                            <div className="flex items-baseline gap-1 min-w-0">
                                <span className="font-bold text-text text-sm group-hover:text-primary transition shrink-0">
                                    {sym}
                                </span>
                                {stock.name && (
                                    <span className="text-[10px] text-text-muted truncate">
                                        ({stock.name})
                                    </span>
                                )}
                            </div>

                            <div className="shrink-0">
                                <MiniSparkline symbol={stock.symbol} color={sparkColor} width={60} height={22} />
                            </div>

                            <div className="text-xs font-mono whitespace-nowrap shrink-0">
                                <span className="font-bold text-text">₺{price.toFixed(2)}</span>
                                <span className={`ml-1 ${changeColor}`}>
                                    ({isPositive ? '+' : ''}{changeVal.toFixed(1)}%)
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
