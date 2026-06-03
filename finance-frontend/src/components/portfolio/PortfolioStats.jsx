import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PieChart, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';

const MASK = '••••••';

const PortfolioStats = ({ portfolio, calculateProfitLoss, hidden = false, inflationFactor = null }) => {
    const { t } = useTranslation('portfolio');
    const { formatPrice } = useCurrency();

    // Toplamlar TRY bazlı tutulur; TRY/USD toggle formatPrice ile uygulanır.
    const money = (v) => (hidden ? MASK : formatPrice(v, 'TRY'));

    const totalInvestment = portfolio?.reduce((sum, item) => {
        return sum + (item.averagePrice * item.quantity * (Number(item.contractSize) || 1));
    }, 0) || 0;

    const totalValue = portfolio?.reduce((sum, item) => {
        const calc = calculateProfitLoss(item);
        return sum + calc.currentValue;
    }, 0) || 0;

    const totalProfitLoss = totalValue - totalInvestment;

    const returnRate = totalInvestment > 0
        ? ((totalProfitLoss / totalInvestment) * 100)
        : 0;

    // Reel (enflasyon-düzeltilmiş) K/Z: maliyet bugünkü liraya çekilir (× CPI_now/CPI_alış).
    const hasReal = inflationFactor != null && inflationFactor > 0 && totalInvestment > 0;
    const realCost = hasReal ? totalInvestment * inflationFactor : null;
    const realProfitLoss = hasReal ? totalValue - realCost : null;
    const realReturnRate = hasReal ? (realProfitLoss / realCost) * 100 : null;

    // Reel kartı varsa 5 kolon (xl), yoksa 4 kolon
    const gridCols = hasReal ? 'md:grid-cols-2 xl:grid-cols-5' : 'md:grid-cols-2 xl:grid-cols-4';

    return (
        <div className={`grid grid-cols-1 ${gridCols} gap-4 mb-6`}>
            <div className="bg-surface-2 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Wallet size={20} className="text-text-muted" />
                    <p className="text-text-muted text-sm">{t('stats.totalCost')}</p>
                </div>
                <p className="text-2xl font-bold">{money(totalInvestment)}</p>
            </div>

            <div className="bg-surface-2 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    <PieChart size={20} className="text-text-muted" />
                    <p className="text-text-muted text-sm">{t('stats.totalValue')}</p>
                </div>
                <p className="text-2xl font-bold">{money(totalValue)}</p>
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
                    {hidden ? MASK : `${totalProfitLoss >= 0 ? '+' : ''}${formatPrice(totalProfitLoss, 'TRY')}`}
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
                    {hidden ? MASK : `${returnRate >= 0 ? '+' : ''}${returnRate.toFixed(2)}%`}
                </p>
            </div>

            {hasReal && (
                <div
                    className="bg-surface-2 rounded-lg p-6 border border-primary/30"
                    title={t('stats.realPnlTip', 'Enflasyona göre düzeltilmiş kâr/zarar')}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Activity size={20} className={realProfitLoss >= 0 ? 'text-buy' : 'text-sell'} />
                        <p className="text-text-muted text-sm">{t('stats.realPnl', 'Reel')} K/Z</p>
                    </div>
                    <p className={`text-2xl font-bold ${realProfitLoss >= 0 ? 'text-buy' : 'text-sell'}`}>
                        {hidden ? MASK : `${realProfitLoss >= 0 ? '+' : ''}${formatPrice(realProfitLoss, 'TRY')}`}
                    </p>
                    <p className={`text-xs mt-1 ${realReturnRate >= 0 ? 'text-buy' : 'text-sell'}`}>
                        {hidden ? MASK : `${realReturnRate >= 0 ? '+' : ''}${realReturnRate.toFixed(2)}%`}
                        <span className="text-text-muted ml-1">
                            ({t('stats.inflation', 'Enflasyon')}: ×{inflationFactor.toFixed(2)})
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default PortfolioStats;
