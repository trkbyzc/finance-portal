import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { portfolioApi } from '../../../services/api/portfolioApi';
import usePortfolioPricing from '../../PortfolioPage/hooks/usePortfolioPricing';
import { formatNumber } from '../../../utils/formatters/numberFormatter';
import DashboardWidgetCard from './DashboardWidgetCard';

// Dağılım bar/legend renkleri — tema token'larından döngüsel
const SLICE_COLORS = ['bg-primary', 'bg-buy', 'bg-warning', 'bg-sell', 'bg-primary/60', 'bg-buy/60'];

const TYPE_LABELS = {
    STOCK: 'Hisse', CRYPTO: 'Kripto', CURRENCY: 'Döviz',
    COMMODITY: 'Emtia', BOND: 'Tahvil', FUND: 'Fon'
};

export default function PortfolioSummaryWidget() {
    const { t } = useTranslation(['dashboard', 'common']);
    const navigate = useNavigate();

    const { data: portfolio, isLoading } = useQuery({
        queryKey: ['portfolio'],
        queryFn: portfolioApi.getMyPortfolio
    });

    const { calculateProfitLoss } = usePortfolioPricing(portfolio);

    const stats = useMemo(() => {
        if (!portfolio || portfolio.length === 0) return null;
        const totalInvestment = portfolio.reduce((s, it) => s + (it.averagePrice * it.quantity), 0);
        let totalValue = 0;
        const byType = {};
        portfolio.forEach((it) => {
            const { currentValue } = calculateProfitLoss(it);
            const val = Number.isFinite(currentValue) ? currentValue : 0;
            totalValue += val;
            byType[it.assetType] = (byType[it.assetType] || 0) + val;
        });
        const totalPnl = totalValue - totalInvestment;
        const pnlPercent = totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;
        const distribution = Object.entries(byType)
            .map(([type, value]) => ({ type, value, pct: totalValue > 0 ? (value / totalValue) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);
        return { totalValue, totalPnl, pnlPercent, distribution };
    }, [portfolio, calculateProfitLoss]);

    const shellProps = {
        title: t('dashboard:widgets.portfolioTitle'),
        viewAllLabel: t('dashboard:widgets.viewAll'),
        onViewAll: () => navigate('/portfolio')
    };

    if (isLoading) {
        return <DashboardWidgetCard {...shellProps}><div className="h-40 animate-pulse bg-surface-2 rounded-xl" /></DashboardWidgetCard>;
    }

    // Boş durum — teşvik edici CTA
    if (!stats) {
        return (
            <DashboardWidgetCard {...shellProps}>
                <div className="py-8 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                        <Wallet size={26} />
                    </div>
                    <h3 className="text-base font-bold text-text">{t('dashboard:widgets.emptyPortfolioTitle')}</h3>
                    <p className="text-text-muted text-sm mt-1 max-w-xs">{t('dashboard:widgets.emptyPortfolioDesc')}</p>
                    <button
                        onClick={() => navigate('/portfolio')}
                        className="mt-5 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-fg rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
                    >
                        <Plus size={16} /> {t('dashboard:widgets.emptyPortfolioCta')}
                    </button>
                </div>
            </DashboardWidgetCard>
        );
    }

    const pnlUp = stats.totalPnl >= 0;

    return (
        <DashboardWidgetCard {...shellProps}>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-2 border border-border rounded-xl p-4">
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">{t('dashboard:widgets.totalValue')}</p>
                    <p className="text-xl font-mono font-black text-text">₺{formatNumber(stats.totalValue, 2, 2)}</p>
                </div>
                <div className="bg-surface-2 border border-border rounded-xl p-4">
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">{t('dashboard:widgets.dailyPnl')}</p>
                    <p className={`text-xl font-mono font-black flex items-center gap-1 ${pnlUp ? 'text-buy' : 'text-sell'}`}>
                        {pnlUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {pnlUp ? '+' : ''}{formatNumber(stats.totalPnl, 2, 2)} ₺
                        <span className="text-xs">({pnlUp ? '+' : ''}{stats.pnlPercent.toFixed(2)}%)</span>
                    </p>
                </div>
            </div>

            <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-2">{t('dashboard:widgets.distribution')}</p>
            <div className="flex h-3 rounded-full overflow-hidden bg-surface-2 mb-3">
                {stats.distribution.map((d, i) => (
                    <div
                        key={d.type}
                        className={SLICE_COLORS[i % SLICE_COLORS.length]}
                        style={{ width: `${d.pct}%` }}
                        title={`${TYPE_LABELS[d.type] || d.type} %${d.pct.toFixed(1)}`}
                    />
                ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {stats.distribution.map((d, i) => (
                    <div key={d.type} className="flex items-center gap-1.5 text-xs">
                        <span className={`w-2.5 h-2.5 rounded-sm ${SLICE_COLORS[i % SLICE_COLORS.length]}`} />
                        <span className="text-text font-semibold">{TYPE_LABELS[d.type] || d.type}</span>
                        <span className="text-text-muted font-mono">%{d.pct.toFixed(1)}</span>
                    </div>
                ))}
            </div>
        </DashboardWidgetCard>
    );
}
