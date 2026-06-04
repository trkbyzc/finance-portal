import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PieChart, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';

const MASK = '••••••';

/**
 * Tek bir özet kartı. Renk/ikon "tone"a göre belirlenir:
 *   neutral → gri ikon çipi, nötr değer
 *   pnl     → değere göre yeşil/kırmızı (kâr/zarar)
 */
function StatCard({ icon: Icon, label, value, sub, tone = 'neutral', positive = true, highlight = false }) {
    const valueColor = tone === 'pnl' ? (positive ? 'text-buy' : 'text-sell') : 'text-text';
    const chip = tone === 'pnl'
        ? (positive ? 'bg-buy/10 text-buy border-buy/20' : 'bg-sell/10 text-sell border-sell/20')
        : 'bg-primary/10 text-primary border-primary/20';
    return (
        <div className={`bg-surface border rounded-2xl p-5 shadow-sm transition-colors ${highlight ? 'border-primary/40' : 'border-border'}`}>
            <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${chip}`}>
                    <Icon size={18} />
                </div>
                <p className="text-text-muted text-[11px] font-bold uppercase tracking-wider leading-tight">{label}</p>
            </div>
            <p className={`text-2xl font-mono font-black tracking-tight ${valueColor}`}>{value}</p>
            {sub && <div className="mt-1">{sub}</div>}
        </div>
    );
}

const PortfolioStats = ({ portfolio, calculateProfitLoss, hidden = false, inflationFactor = null }) => {
    const { t } = useTranslation('portfolio');
    const { formatPrice } = useCurrency();

    // Toplamlar TRY bazlı; büyük tutarlar 2 ondalıkla gösterilir (₺49.768,01)
    const money = (v) => (hidden ? MASK : formatPrice(v, 'TRY', 2, 2));
    const signed = (v) => (hidden ? MASK : `${v >= 0 ? '+' : ''}${formatPrice(v, 'TRY', 2, 2)}`);
    const pct = (v) => (hidden ? MASK : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`);

    const totalInvestment = portfolio?.reduce((sum, item) => {
        return sum + (item.averagePrice * item.quantity * (Number(item.contractSize) || 1));
    }, 0) || 0;

    const totalValue = portfolio?.reduce((sum, item) => {
        const calc = calculateProfitLoss(item);
        return sum + calc.currentValue;
    }, 0) || 0;

    const totalProfitLoss = totalValue - totalInvestment;
    const returnRate = totalInvestment > 0 ? ((totalProfitLoss / totalInvestment) * 100) : 0;
    const pnlUp = totalProfitLoss >= 0;

    // Reel (enflasyon-düzeltilmiş) K/Z: maliyet bugünkü liraya çekilir (× CPI_now/CPI_alış).
    const hasReal = inflationFactor != null && inflationFactor > 0 && totalInvestment > 0;
    const realCost = hasReal ? totalInvestment * inflationFactor : null;
    const realProfitLoss = hasReal ? totalValue - realCost : null;
    const realReturnRate = hasReal ? (realProfitLoss / realCost) * 100 : null;
    const realUp = hasReal && realProfitLoss >= 0;

    const gridCols = hasReal ? 'md:grid-cols-2 xl:grid-cols-5' : 'md:grid-cols-2 xl:grid-cols-4';

    return (
        <div className={`grid grid-cols-1 ${gridCols} gap-4 mb-6`}>
            <StatCard icon={Wallet} label={t('stats.totalCost')} value={money(totalInvestment)} />

            <StatCard icon={PieChart} label={t('stats.totalValue')} value={money(totalValue)} />

            <StatCard
                icon={pnlUp ? TrendingUp : TrendingDown}
                label={t('stats.totalPnl')}
                value={signed(totalProfitLoss)}
                tone="pnl"
                positive={pnlUp}
            />

            <StatCard
                icon={pnlUp ? TrendingUp : TrendingDown}
                label={t('stats.totalPnlPercent')}
                value={pct(returnRate)}
                tone="pnl"
                positive={pnlUp}
            />

            {hasReal && (
                <StatCard
                    icon={Activity}
                    label={`${t('stats.realPnl', 'Reel')} K/Z`}
                    value={signed(realProfitLoss)}
                    tone="pnl"
                    positive={realUp}
                    highlight
                    sub={
                        <p className={`text-xs font-bold ${realUp ? 'text-buy' : 'text-sell'}`}>
                            {pct(realReturnRate)}
                            <span className="text-text-muted font-medium ml-1">
                                ({t('stats.inflation', 'Enflasyon')} ×{inflationFactor.toFixed(2)})
                            </span>
                        </p>
                    }
                />
            )}
        </div>
    );
};

export default PortfolioStats;
