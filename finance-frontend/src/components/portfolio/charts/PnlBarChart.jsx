import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../../context/CurrencyContext';
import { formatCurrency } from '../../../utils/formatters/currencyFormatter';
import { tooltipStyle } from './portfolioChartColors';

/**
 * Sembol bazlı P/L bar grafiği — pozitif yeşil gradient, negatif kırmızı gradient.
 * Tutarlar üstteki TL/$ toggle'ına göre gösterilir (TRY bazlı değer seçili para birimine çevrilir).
 */
export default function PnlBarChart({ portfolio, calculateProfitLoss }) {
    const { t } = useTranslation('portfolio');
    const { currency, convertPrice } = useCurrency();

    const assetProfitLoss = (portfolio || []).map(item => {
        const calc = calculateProfitLoss(item);
        return {
            name: item.symbol,
            assetType: item.assetType,
            // TRY bazlı K/Z'yi seçili para birimine çevir — eksen, barlar ve tooltip tutarlı olsun
            pnl: Number(convertPrice(Number(calc.profitLoss ?? 0), 'TRY'))
        };
    });

    return (
        <div className="bg-surface-2 rounded-2xl p-6 border border-border/50 relative overflow-hidden">
            <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{ background: 'radial-gradient(circle at 70% 20%, rgba(16,185,129,0.08), transparent 60%)' }}
            />
            <h3 className="text-xl font-bold mb-1 relative">{t('stats.totalPnl')}</h3>
            <p className="text-xs text-text-muted mb-4 relative">{t('charts.pnlSub', 'Varlık bazlı kâr / zarar')}</p>

            {assetProfitLoss.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={assetProfitLoss} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id="pnl-positive" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                                <stop offset="100%" stopColor="#16a34a" stopOpacity={0.85} />
                            </linearGradient>
                            <linearGradient id="pnl-negative" x1="0" y1="1" x2="0" y2="0">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.85} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--color-text-muted)"
                            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                            axisLine={{ stroke: 'var(--color-border)' }}
                        />
                        <YAxis
                            stroke="var(--color-text-muted)"
                            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                            axisLine={{ stroke: 'var(--color-border)' }}
                        />
                        <Tooltip
                            formatter={(value) => [formatCurrency(value, currency, 2, 2), t('stats.totalPnl')]}
                            contentStyle={tooltipStyle}
                            cursor={{ fill: 'var(--color-text-muted)', fillOpacity: 0.08 }}
                        />
                        <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                            {assetProfitLoss.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.pnl >= 0 ? 'url(#pnl-positive)' : 'url(#pnl-negative)'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-80 flex items-center justify-center text-text-muted">
                    {t('holdings.noHoldings')}
                </div>
            )}
        </div>
    );
}
