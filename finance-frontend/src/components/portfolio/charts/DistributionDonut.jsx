import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../../context/CurrencyContext';
import { ASSET_COLORS, DEFAULT_COLOR, buildSymbolShades, tooltipStyle } from './portfolioChartColors';

/**
 * Donut chart — varlık tipine veya sembole göre dağılım (groupBy prop).
 * Ortada toplam değer; altında legend chip'leri. Tutarlar üstteki TL/$ toggle'ına göre gösterilir.
 */
export default function DistributionDonut({ portfolio, calculateProfitLoss, groupBy, parentAssetType }) {
    const { t } = useTranslation(['portfolio', 'markets', 'common']);
    const { formatPrice } = useCurrency();
    const [hovered, setHovered] = useState(false); // hover'da merkez etiketini gizle (tooltip ile çakışmasın)
    const fmt = (v) => formatPrice(v, 'TRY', 2, 2); // TRY bazlı değer -> seçili para birimine çevrilir

    const distribution = (portfolio || []).reduce((acc, item) => {
        const calc = calculateProfitLoss(item);
        const key = groupBy === 'symbol' ? item.symbol : item.assetType;
        const existing = acc.find(a => a.name === key);
        if (existing) existing.value += calc.currentValue;
        else acc.push({ name: key, value: calc.currentValue });
        return acc;
    }, []);

    const totalValue = distribution.reduce((s, x) => s + Number(x.value || 0), 0);

    const assetTypeNames = {
        STOCK: t('common:assetTypes.STOCK'),
        CRYPTO: t('common:assetTypes.CRYPTO'),
        CURRENCY: t('common:assetTypes.CURRENCY'),
        COMMODITY: t('common:assetTypes.COMMODITY'),
        BOND: t('common:assetTypes.BOND'),
        FUND: t('common:assetTypes.FUND'),
        FUTURE: t('markets:categories.viop')
    };

    const colorForDistEntry = (entry, idx) => {
        if (groupBy === 'symbol' && parentAssetType) {
            const baseColor = (ASSET_COLORS[parentAssetType] || DEFAULT_COLOR).base;
            return buildSymbolShades(baseColor)[idx % 8];
        }
        return ASSET_COLORS[entry.name] || DEFAULT_COLOR;
    };

    const labelFor = (name) => groupBy === 'symbol' ? name : (assetTypeNames[name] || name);

    const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.05) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text
                x={x} y={y} fill="#ffffff"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                style={{ fontSize: 13, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
            >
                {`${(percent * 100).toFixed(1)}%`}
            </text>
        );
    };

    const title = groupBy === 'symbol'
        ? t('portfolio:charts.distributionBySymbol', 'Sembol Dağılımı')
        : t('portfolio:charts.distribution');
    const subtitle = groupBy === 'symbol'
        ? t('portfolio:charts.distributionBySymbolSub', 'Bu kategorideki varlıkların değer dağılımı')
        : t('portfolio:charts.distributionSub', 'Varlık türüne göre dağılım');

    return (
        <div className="bg-surface-2 rounded-2xl p-6 border border-border/50 relative overflow-hidden">
            <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{ background: 'radial-gradient(circle at 30% 20%, rgba(59,130,246,0.08), transparent 60%)' }}
            />
            <h3 className="text-xl font-bold mb-1 relative">{title}</h3>
            <p className="text-xs text-text-muted mb-4 relative">{subtitle}</p>

            {distribution.length > 0 ? (
                <div className="relative">
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <defs>
                                {distribution.map((entry, idx) => {
                                    const c = colorForDistEntry(entry, idx);
                                    const gradId = `grad-${groupBy}-${entry.name}`;
                                    return (
                                        <radialGradient key={gradId} id={gradId} cx="50%" cy="50%" r="65%" fx="35%" fy="35%">
                                            <stop offset="0%" stopColor={c.light} stopOpacity={1} />
                                            <stop offset="100%" stopColor={c.base} stopOpacity={1} />
                                        </radialGradient>
                                    );
                                })}
                            </defs>
                            <Pie
                                data={distribution}
                                cx="50%" cy="50%"
                                innerRadius={68} outerRadius={115}
                                paddingAngle={2}
                                dataKey="value"
                                labelLine={false}
                                label={renderPieLabel}
                                stroke="var(--color-surface)"
                                strokeWidth={3}
                                onMouseEnter={() => setHovered(true)}
                                onMouseLeave={() => setHovered(false)}
                            >
                                {distribution.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={`url(#grad-${groupBy}-${entry.name})`} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name) => [fmt(value), labelFor(name)]}
                                contentStyle={tooltipStyle}
                                separator=": "
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {!hovered && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-[10px] uppercase tracking-wider text-text-muted">
                                {t('portfolio:stats.totalValue', 'Toplam Değer')}
                            </div>
                            <div className="text-xl font-bold text-text mt-0.5">
                                {fmt(totalValue)}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2">
                        {distribution.map((entry, idx) => {
                            const c = colorForDistEntry(entry, idx);
                            return (
                                <div key={`leg-${entry.name}`} className="inline-flex items-center gap-1.5 text-[11px]">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.base }} />
                                    <span className="text-text-muted">{labelFor(entry.name)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="h-80 flex items-center justify-center text-text-muted">
                    {t('portfolio:holdings.noHoldings')}
                </div>
            )}
        </div>
    );
}
