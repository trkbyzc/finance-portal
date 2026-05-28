import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

/**
 * Vivid asset-type palette — saturated tones with paired light/dark stops for radial-gradient pie sectors
 * ve linear-gradient bar fill'leri. Eski palet zayıf kalmıştı; bu set hem chart hem chip için tutarlı.
 */
const ASSET_COLORS = {
    STOCK:     { base: '#3b82f6', light: '#60a5fa' }, // blue
    CRYPTO:    { base: '#f59e0b', light: '#fbbf24' }, // amber
    CURRENCY:  { base: '#10b981', light: '#34d399' }, // emerald
    COMMODITY: { base: '#eab308', light: '#facc15' }, // yellow
    BOND:      { base: '#8b5cf6', light: '#a78bfa' }, // violet
    FUND:      { base: '#ec4899', light: '#f472b6' }, // pink
    FUTURE:    { base: '#06b6d4', light: '#22d3ee' }  // cyan
};
const DEFAULT_COLOR = { base: '#64748b', light: '#94a3b8' };

const fmtTry = (v) => Number(v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PortfolioCharts = ({ portfolio, calculateProfitLoss }) => {
    const { t } = useTranslation(['portfolio', 'markets', 'common']);

    const assetTypeDistribution = portfolio?.reduce((acc, item) => {
        const calc = calculateProfitLoss(item);
        const existing = acc.find(a => a.name === item.assetType);
        if (existing) existing.value += calc.currentValue;
        else acc.push({ name: item.assetType, value: calc.currentValue });
        return acc;
    }, []) || [];

    const totalValue = assetTypeDistribution.reduce((s, x) => s + Number(x.value || 0), 0);

    const assetProfitLoss = portfolio?.map(item => {
        const calc = calculateProfitLoss(item);
        return {
            name: item.symbol,
            assetType: item.assetType,
            pnl: Number(calc.profitLoss ?? 0)
        };
    }) || [];

    const assetTypeNames = {
        STOCK: t('common:assetTypes.STOCK'),
        CRYPTO: t('common:assetTypes.CRYPTO'),
        CURRENCY: t('common:assetTypes.CURRENCY'),
        COMMODITY: t('common:assetTypes.COMMODITY'),
        BOND: t('common:assetTypes.BOND'),
        FUND: t('common:assetTypes.FUND'),
        FUTURE: t('markets:categories.viop')
    };

    const colorOf = (type) => ASSET_COLORS[type] || DEFAULT_COLOR;

    /** Pie sector etiketleri — sadece %5'ten büyük slice'larda yazı, küçükler legend'da. */
    const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
        if (percent < 0.05) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text
                x={x}
                y={y}
                fill="#ffffff"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                style={{ fontSize: 13, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
            >
                {`${(percent * 100).toFixed(1)}%`}
            </text>
        );
    };

    /** Theme-aware tooltip — CSS variable'lardan beslenir, dark/light/hybrid tema fark etmez. */
    const tooltipStyle = {
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        color: 'var(--color-text)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        padding: '10px 12px'
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* DONUT — Asset type distribution */}
            <div className="bg-surface-2 rounded-2xl p-6 border border-border/50 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-40"
                     style={{ background: 'radial-gradient(circle at 30% 20%, rgba(59,130,246,0.08), transparent 60%)' }} />
                <h3 className="text-xl font-bold mb-1 relative">{t('portfolio:charts.distribution')}</h3>
                <p className="text-xs text-text-muted mb-4 relative">{t('portfolio:charts.distributionSub', 'Varlık türüne göre dağılım')}</p>
                {assetTypeDistribution.length > 0 ? (
                    <div className="relative">
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <defs>
                                    {assetTypeDistribution.map((entry) => {
                                        const c = colorOf(entry.name);
                                        return (
                                            <radialGradient key={`grad-${entry.name}`} id={`grad-${entry.name}`} cx="50%" cy="50%" r="65%" fx="35%" fy="35%">
                                                <stop offset="0%" stopColor={c.light} stopOpacity={1} />
                                                <stop offset="100%" stopColor={c.base} stopOpacity={1} />
                                            </radialGradient>
                                        );
                                    })}
                                </defs>
                                <Pie
                                    data={assetTypeDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={68}
                                    outerRadius={115}
                                    paddingAngle={2}
                                    dataKey="value"
                                    labelLine={false}
                                    label={renderPieLabel}
                                    stroke="var(--color-surface)"
                                    strokeWidth={3}
                                >
                                    {assetTypeDistribution.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={`url(#grad-${entry.name})`} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `${fmtTry(value)} ₺`}
                                    labelFormatter={(name) => assetTypeNames[name] || name}
                                    contentStyle={tooltipStyle}
                                />
                                <Legend
                                    formatter={(value) => (
                                        <span style={{ color: 'var(--color-text)', fontSize: 12 }}>
                                            {assetTypeNames[value] || value}
                                        </span>
                                    )}
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center label — donut'un ortasında toplam değer */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: 40 }}>
                            <div className="text-[10px] uppercase tracking-wider text-text-muted">
                                {t('portfolio:stats.totalValue', 'Toplam Değer')}
                            </div>
                            <div className="text-xl font-bold text-text mt-0.5">
                                {fmtTry(totalValue)} ₺
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-80 flex items-center justify-center text-text-muted">
                        {t('portfolio:holdings.noHoldings')}
                    </div>
                )}
            </div>

            {/* BAR — Per-asset PnL with sign-based color */}
            <div className="bg-surface-2 rounded-2xl p-6 border border-border/50 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-40"
                     style={{ background: 'radial-gradient(circle at 70% 20%, rgba(16,185,129,0.08), transparent 60%)' }} />
                <h3 className="text-xl font-bold mb-1 relative">{t('portfolio:stats.totalPnl')}</h3>
                <p className="text-xs text-text-muted mb-4 relative">{t('portfolio:charts.pnlSub', 'Varlık bazlı kâr / zarar')}</p>
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
                                formatter={(value) => [`${fmtTry(value)} ₺`, t('portfolio:stats.totalPnl')]}
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
                        {t('portfolio:holdings.noHoldings')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioCharts;
