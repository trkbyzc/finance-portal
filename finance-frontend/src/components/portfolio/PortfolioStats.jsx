import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PortfolioStats = ({ portfolio, calculateProfitLoss }) => {
    const { t } = useTranslation('portfolio');
    const totalInvestment = portfolio?.reduce((sum, item) => {
        return sum + (item.averagePrice * item.quantity);
    }, 0) || 0;

    const totalValue = portfolio?.reduce((sum, item) => {
        const calc = calculateProfitLoss(item);
        return sum + calc.currentValue;
    }, 0) || 0;

    const totalProfitLoss = totalValue - totalInvestment;

    const returnRate = totalInvestment > 0
        ? ((totalProfitLoss / totalInvestment) * 100)
        : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-2 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Wallet size={20} className="text-text-muted" />
                    <p className="text-text-muted text-sm">{t('stats.totalCost')}</p>
                </div>
                <p className="text-2xl font-bold">{totalInvestment.toFixed(2)} ₺</p>
            </div>

            <div className="bg-surface-2 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    <PieChart size={20} className="text-text-muted" />
                    <p className="text-text-muted text-sm">{t('stats.totalValue')}</p>
                </div>
                <p className="text-2xl font-bold">{totalValue.toFixed(2)} ₺</p>
            </div>

            <div className="bg-surface-2 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    {totalProfitLoss >= 0 ? (
                        <TrendingUp size={20} className="text-buy" />
                    ) : (
                        <TrendingDown size={20} className="text-sell" />
                    )}
                    <p className="text-text-muted text-sm">{t('stats.totalPnl')}</p>
                </div>
                <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-buy' : 'text-sell'}`}>
                    {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)} ₺
                </p>
            </div>

            <div className="bg-surface-2 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    {returnRate >= 0 ? (
                        <TrendingUp size={20} className="text-buy" />
                    ) : (
                        <TrendingDown size={20} className="text-sell" />
                    )}
                    <p className="text-text-muted text-sm">{t('stats.totalPnlPercent')}</p>
                </div>
                <p className={`text-2xl font-bold ${returnRate >= 0 ? 'text-buy' : 'text-sell'}`}>
                    {returnRate >= 0 ? '+' : ''}{returnRate.toFixed(2)}%
                </p>
            </div>
        </div>
    );
};

export default PortfolioStats;
