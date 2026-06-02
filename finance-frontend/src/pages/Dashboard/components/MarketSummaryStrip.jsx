import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { aggregateApi } from '../../../services/api';
import { formatNumber } from '../../../utils/formatters/numberFormatter';

/**
 * Giriş yapmış dashboard'un üst şeridi — BIST 100, Dolar, Euro, Bitcoin anlık mini kartları.
 * Portföy boş olsa bile sayfanın canlı/dolu hissetmesini sağlar.
 */
export default function MarketSummaryStrip() {
    const { t } = useTranslation('dashboard');
    const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ['dashboardMarketSummary'],
        queryFn: async () => {
            const [indices, currencies, crypto] = await Promise.all([
                aggregateApi.getMarketsByEndpoint('/indices').catch(() => []),
                aggregateApi.getMarketsByEndpoint('/currencies').catch(() => []),
                aggregateApi.getMarketsByEndpoint('/crypto-currencies').catch(() => [])
            ]);
            const bist = (indices || []).find(i =>
                (i.symbol || '').includes('XU100') ||
                (i.name || '').replace(/\s/g, '').toUpperCase().includes('BIST100')
            );
            const usd = (currencies || []).find(c => c.currencyCode === 'USD');
            const eur = (currencies || []).find(c => c.currencyCode === 'EUR');
            const btc = (crypto || []).find(c => c.currencyCode === 'BTC');
            return { bist, usd, eur, btc };
        },
        staleTime: 60 * 1000
    });

    const cards = [
        {
            label: t('summary.bist100'),
            value: data?.bist?.price,
            change: data?.bist?.changePercent,
            prefix: '',
            onClick: () => data?.bist?.symbol && navigate(`/chart/${encodeURIComponent(data.bist.symbol)}?cat=INDEX`)
        },
        {
            label: t('summary.usd'),
            value: data?.usd?.forexSelling,
            change: data?.usd?.changePercent,
            prefix: '₺',
            onClick: () => navigate('/chart/USD?cat=CURRENCY')
        },
        {
            label: t('summary.eur'),
            value: data?.eur?.forexSelling,
            change: data?.eur?.changePercent,
            prefix: '₺',
            onClick: () => navigate('/chart/EUR?cat=CURRENCY')
        },
        {
            label: t('summary.btc'),
            value: data?.btc?.forexBuying ?? data?.btc?.price,
            change: data?.btc?.changePercent,
            prefix: '$',
            onClick: () => navigate('/chart/BTC-USD?cat=CRYPTO')
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card, i) => {
                const hasData = card.value != null;
                const change = Number(card.change || 0);
                const isUp = change >= 0;
                return (
                    <button
                        key={i}
                        onClick={card.onClick}
                        className="text-left bg-surface border border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-muted text-[11px] font-bold uppercase tracking-wider">{card.label}</span>
                            {hasData && (
                                <span className={`flex items-center gap-0.5 text-xs font-bold ${isUp ? 'text-buy' : 'text-sell'}`}>
                                    {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {isUp ? '+' : ''}{change.toFixed(2)}%
                                </span>
                            )}
                        </div>
                        <div className="text-xl font-mono font-black text-text group-hover:text-primary transition-colors">
                            {hasData ? `${card.prefix}${formatNumber(card.value, 2, 2)}` : '—'}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
