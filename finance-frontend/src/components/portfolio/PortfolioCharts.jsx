import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

/**
 * Vivid asset-type palette — saturated tones with paired light/dark stops for radial-gradient pie sectors
 * ve linear-gradient bar fill'leri. Eski palet zayıf kalmıştı; bu set hem chart hem chip için tutarlı.
 */
const ASSET_COLORS = {
    STOCK:     { base: '#3b82f6', light: '#60a5fa' },
    CRYPTO:    { base: '#f59e0b', light: '#fbbf24' },
    CURRENCY:  { base: '#10b981', light: '#34d399' },
    COMMODITY: { base: '#eab308', light: '#facc15' },
    BOND:      { base: '#8b5cf6', light: '#a78bfa' },
    FUND:      { base: '#ec4899', light: '#f472b6' },
    FUTURE:    { base: '#06b6d4', light: '#22d3ee' }
};
const DEFAULT_COLOR = { base: '#64748b', light: '#94a3b8' };

/**
 * Symbol-bazlı görünüm için, parent asset-type renginden türetilen 8 ton.
 * Aynı kategori içinde 8'den fazla varlık varsa modulo ile döner.
 */
const buildSymbolShades = (base) => {
    // HSL'e gitmeden basit alpha varyasyonu — koyudan açığa 8 ton, gradient'lerle birlikte canlı kalır.
    return [
        { base, light: base },
        { base: shade(base, 0.85), light: shade(base, 1.15) },
        { base: shade(base, 1.15), light: shade(base, 1.4) },
        { base: shade(base, 0.7), light: shade(base, 0.95) },
        { base: shade(base, 1.3), light: shade(base, 1.5) },
        { base: shade(base, 0.55), light: shade(base, 0.85) },
        { base: shade(base, 1.45), light: shade(base, 1.65) },
        { base: shade(base, 0.4), light: shade(base, 0.7) }
    ];
};

/** Basit lighten/darken — hex → RGB, factor < 1 koyulaştır, > 1 açıklaştır. */
function shade(hex, factor) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const adjust = (c) => Math.max(0, Math.min(255, Math.round(c * factor)));
    return `#${[adjust(r), adjust(g), adjust(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

const fmtTry = (v) => Number(v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * @param {object[]} portfolio
 * @param {function} calculateProfitLoss
 * @param {'assetType'|'symbol'} groupBy — 'assetType' (Tümü tab'ı) varsayılan;
 *        'symbol' tek-tip tab'da varlıkları sembol bazında dağıt.
 * @param {string} [parentAssetType] — groupBy='symbol' olduğunda renk paletini üreten ana tip.
 */
const PortfolioCharts = ({ portfolio, calculateProfitLoss, groupBy = 'assetType', parentAssetType }) => {
    const { t } = useTranslation(['portfolio', 'markets', 'common']);

    // Distribution — tab moduna göre farklı grouping
    const distribution = (portfolio || []).reduce((acc, item) => {
        const calc = calculateProfitLoss(item);
        const key = groupBy === 'symbol' ? item.symbol : item.assetType;
        const existing = acc.find(a => a.name === key);
        if (existing) existing.value += calc.currentValue;
        else acc.push({ name: key, value: calc.currentValue });
        return acc;
    }, []);

    const totalValue = distribution.reduce((s, x) => s + Number(x.value || 0), 0);

    const assetProfitLoss = (portfolio || []).map(item => {
        const calc = calculateProfitLoss(item);
        return {
            name: item.symbol,
            assetType: item.assetType,
            pnl: Number(calc.profitLoss ?? 0)
        };
    });

    const assetTypeNames = {
        STOCK: t('common:assetTypes.STOCK'),
        CRYPTO: t('common:assetTypes.CRYPTO'),
        CURRENCY: t('common:assetTypes.CURRENCY'),
        COMMODITY: t('common:assetTypes.COMMODITY'),
        BOND: t('common:assetTypes.BOND'),
        FUND: t('common:assetTypes.FUND'),
        FUTURE: t('markets:categories.viop')
    };

    /** Distribution slice renkleri — assetType modunda asset rengi, symbol modunda parent shade'i. */
    const colorForDistEntry = (entry, idx) => {
        if (groupBy === 'symbol' && parentAssetType) {
            const baseColor = (ASSET_COLORS[parentAssetType] || DEFAULT_COLOR).base;
            const shades = buildSymbolShades(baseColor);
            return shades[idx % shades.length];
        }
        return ASSET_COLORS[entry.name] || DEFAULT_COLOR;
    };

    /** Tooltip label — assetType modunda i18n adı, symbol modunda ham sembol. */
    const labelFor = (name) =>
        groupBy === 'symbol' ? name : (assetTypeNames[name] || name);

    /** Pie sector etiketleri — sadece %5'ten büyük slice'larda yazı, küçükler tooltip'te. */
    const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
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

    const tooltipStyle = {
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        color: 'var(--color-text)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        padding: '10px 12px'
    };

    const distributionTitle = groupBy === 'symbol'
        ? t('portfolio:charts.distributionBySymbol', 'Sembol Dağılımı')
        : t('portfolio:charts.distribution');
    const distributionSub = groupBy === 'symbol'
        ? t('portfolio:charts.distributionBySymbolSub', 'Bu kategorideki varlıkların değer dağılımı')
        : t('portfolio:charts.distributionSub', 'Varlık türüne göre dağılım');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* DONUT */}
            <div className="bg-surface-2 rounded-2xl p-6 border border-border/50 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-40"
                     style={{ background: 'radial-gradient(circle at 30% 20%, rgba(59,130,246,0.08), transparent 60%)' }} />
                <h3 className="text-xl font-bold mb-1 relative">{distributionTitle}</h3>
                <p className="text-xs text-text-muted mb-4 relative">{distributionSub}</p>
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
                                    {distribution.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={`url(#grad-${groupBy}-${entry.name})`} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `${fmtTry(value)} ₺`}
                                    labelFormatter={labelFor}
                                    contentStyle={tooltipStyle}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: 0 }}>
                            <div className="text-[10px] uppercase tracking-wider text-text-muted">
                                {t('portfolio:stats.totalValue', 'Toplam Değer')}
                            </div>
                            <div className="text-xl font-bold text-text mt-0.5">
                                {fmtTry(totalValue)} ₺
                            </div>
                        </div>
                        {/* Legend below center */}
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

            {/* BAR */}
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
