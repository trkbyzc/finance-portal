import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Layers, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../../../../../hooks/useMarketData.js';

export default function BistInfoCards() {
    const { data: stocks, loading: isLoading } = useMarketData('tr-stocks');
    const { t } = useTranslation('markets');

    const stats = useMemo(() => {
        if (!stocks.length) return { gainers: 0, losers: 0, trend: 'NEUTRAL' };

        const gainers = stocks.filter(s => (s.changePercent || s.regularMarketChangePercent || 0) > 0).length;
        const losers = stocks.filter(s => (s.changePercent || s.regularMarketChangePercent || 0) < 0).length;

        return {
            gainers,
            losers,
            total: stocks.length,
            trend: gainers > losers ? 'BULL' : 'BEAR'
        };
    }, [stocks]);

    if (isLoading) return <div className="h-24 animate-pulse bg-surface rounded-xl mb-8 border border-border"></div>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface border border-border p-5 rounded-xl flex items-center justify-between shadow-lg">
                <div>
                    <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">{t('stocks.listedStocks')}</p>
                    <h3 className="text-2xl font-black text-text">{stats.total}</h3>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Layers size={24} />
                </div>
            </div>

            <div className="bg-surface border border-border p-5 rounded-xl flex items-center justify-between shadow-lg">
                <div>
                    <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">{t('stocks.marketDirection')}</p>
                    <h3 className={`text-2xl font-black ${stats.trend === 'BULL' ? 'text-buy' : 'text-sell'}`}>
                        {stats.trend === 'BULL' ? t('stocks.bullish') : t('stocks.bearish')}
                    </h3>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.trend === 'BULL' ? 'bg-buy/10 text-buy' : 'bg-sell/10 text-sell'}`}>
                    <Activity size={24} />
                </div>
            </div>

            <div className="bg-surface border border-border p-5 rounded-xl flex gap-4 shadow-lg">
                <div className="flex-1 flex flex-col items-center justify-center border-r border-border">
                    <TrendingUp size={20} className="text-buy mb-1" />
                    <span className="text-xl font-bold text-buy">{stats.gainers}</span>
                    <span className="text-[10px] text-text-muted uppercase">{t('stocks.gainersShort')}</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <TrendingDown size={20} className="text-sell mb-1" />
                    <span className="text-xl font-bold text-sell">{stats.losers}</span>
                    <span className="text-[10px] text-text-muted uppercase">{t('stocks.losersShort')}</span>
                </div>
            </div>
        </div>
    );
}
