import { useMemo } from 'react';
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { fmtTry, tooltipStyle } from './portfolioChartColors';

const COST_COLOR = '#64748b';   // maliyet — gri
const VALUE_COLOR = '#2962ff';  // piyasa değeri — lacivert
const UP = '#22c55e', DOWN = '#ef4444', FLAT = '#94a3b8', NODATA = '#facc15';

/**
 * Portföy "Tümü" görünümünde varlık listesinin altına eklenen iki çubuk grafik:
 *   1) Maliyet / Piyasa Değeri — her varlık için toplam maliyet vs anlık piyasa değeri.
 *   2) Günlük Durum — pozisyonların günlük % değişimine göre Yükselen/Düşen/Yatay/Veri Yok adedi.
 */
export default function PortfolioActivityCharts({ portfolio, calculateProfitLoss, getDailyChange }) {
    const { t } = useTranslation('portfolio');

    const costVsValue = useMemo(() => (portfolio || []).map(item => {
        const calc = calculateProfitLoss(item);
        const mult = Number(item.contractSize) || 1;
        return {
            name: item.symbol,
            cost: Number((item.averagePrice * item.quantity * mult) || 0),
            value: Number(calc.currentValue || 0)
        };
    }), [portfolio, calculateProfitLoss]);

    const dailyStatus = useMemo(() => {
        let up = 0, down = 0, flat = 0, noData = 0;
        for (const item of portfolio || []) {
            const dc = getDailyChange ? getDailyChange(item.symbol, item.assetType) : null;
            if (dc == null || Number.isNaN(Number(dc))) noData++;
            else if (Number(dc) > 0.05) up++;
            else if (Number(dc) < -0.05) down++;
            else flat++;
        }
        return [
            { key: 'up', label: t('charts.status.up', 'Yükselen'), count: up, color: UP },
            { key: 'down', label: t('charts.status.down', 'Düşen'), count: down, color: DOWN },
            { key: 'flat', label: t('charts.status.flat', 'Yatay'), count: flat, color: FLAT },
            { key: 'noData', label: t('charts.status.noData', 'Veri Yok'), count: noData, color: NODATA }
        ];
    }, [portfolio, getDailyChange, t]);

    if (!portfolio || portfolio.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Maliyet / Piyasa Değeri */}
            <div className="bg-surface-2 rounded-2xl p-6 border border-border/50">
                <h3 className="text-xl font-bold mb-1">{t('charts.costVsValue', 'Maliyet / Piyasa Değeri')}</h3>
                <p className="text-xs text-text-muted mb-4">{t('charts.costVsValueSub', 'Her varlık için toplam maliyet ve anlık piyasa değeri')}</p>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={costVsValue} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                        <XAxis dataKey="name" stroke="var(--color-text-muted)" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} />
                        <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} tickFormatter={(v) => fmtTry(v)} width={70} />
                        <Tooltip
                            formatter={(value, key) => [`${fmtTry(value)} ₺`, key === 'cost' ? t('charts.cost', 'Maliyet') : t('charts.marketValue', 'Piyasa Değeri')]}
                            contentStyle={tooltipStyle}
                            cursor={{ fill: 'var(--color-text-muted)', fillOpacity: 0.08 }}
                        />
                        <Legend formatter={(val) => (val === 'cost' ? t('charts.cost', 'Maliyet') : t('charts.marketValue', 'Piyasa Değeri'))} />
                        <Bar dataKey="cost" fill={COST_COLOR} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="value" fill={VALUE_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Günlük Durum */}
            <div className="bg-surface-2 rounded-2xl p-6 border border-border/50">
                <h3 className="text-xl font-bold mb-1">{t('charts.dailyStatus', 'Günlük Durum')}</h3>
                <p className="text-xs text-text-muted mb-4">{t('charts.dailyStatusSub', 'Pozisyonların günlük % değişimine göre dağılımı (adet)')}</p>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={dailyStatus} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                        <XAxis dataKey="label" stroke="var(--color-text-muted)" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} />
                        <YAxis allowDecimals={false} stroke="var(--color-text-muted)" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} />
                        <Tooltip
                            formatter={(value) => [value, t('charts.positionCount', 'Pozisyon')]}
                            contentStyle={tooltipStyle}
                            cursor={{ fill: 'var(--color-text-muted)', fillOpacity: 0.08 }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {dailyStatus.map((entry) => (
                                <Cell key={entry.key} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
