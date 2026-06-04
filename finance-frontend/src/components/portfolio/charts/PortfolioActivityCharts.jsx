import { useMemo } from 'react';
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../../context/CurrencyContext';
import { formatCurrency } from '../../../utils/formatters/currencyFormatter';
import { fmtTry, tooltipStyle } from './portfolioChartColors';

const COST_COLOR = '#64748b';   // maliyet — gri
const VALUE_COLOR = '#2962ff';  // piyasa değeri — lacivert
const UP = '#22c55e', DOWN = '#ef4444', FLAT = '#94a3b8', NODATA = '#facc15';

function StatusTooltip({ active, payload, noHoldingsLabel }) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={tooltipStyle}>
            <div className="font-bold text-text">{d.label} · {d.count}</div>
            {d.symbols?.length > 0
                ? <div className="text-xs text-text-muted mt-1 max-w-55">{d.symbols.join(', ')}</div>
                : <div className="text-xs text-text-muted mt-1">{noHoldingsLabel}</div>}
        </div>
    );
}

/**
 * Portföy "Tümü" görünümünde varlık listesinin altına eklenen iki çubuk grafik:
 *   1) Maliyet / Piyasa Değeri — her varlık için toplam maliyet vs anlık piyasa değeri.
 *   2) Günlük Durum — pozisyonların günlük % değişimine göre Yükselen/Düşen/Yatay/Veri Yok adedi.
 */
export default function PortfolioActivityCharts({ portfolio, calculateProfitLoss, getDailyChange }) {
    const { t } = useTranslation('portfolio');
    const { currency, convertPrice } = useCurrency();

    const costVsValue = useMemo(() => (portfolio || []).map(item => {
        const calc = calculateProfitLoss(item);
        // TRY bazlı maliyet/değer seçili para birimine çevrilir (eksen/tooltip toggle ile tutarlı)
        return {
            name: item.symbol,
            cost: Number(convertPrice(Number(calc.costValue || 0), 'TRY')),
            value: Number(convertPrice(Number(calc.currentValue || 0), 'TRY'))
        };
    }), [portfolio, calculateProfitLoss, convertPrice]);

    const dailyStatus = useMemo(() => {
        const buckets = { up: [], down: [], flat: [], noData: [] };
        for (const item of portfolio || []) {
            const sym = item.symbol || item.currencyCode;
            const dc = getDailyChange ? getDailyChange(item.symbol, item.assetType) : null;
            if (dc == null || Number.isNaN(Number(dc))) buckets.noData.push(sym);
            else if (Number(dc) > 0.05) buckets.up.push(sym);
            else if (Number(dc) < -0.05) buckets.down.push(sym);
            else buckets.flat.push(sym);
        }
        return [
            { key: 'up', label: t('charts.status.up', 'Yükselen'), count: buckets.up.length, color: UP, symbols: buckets.up },
            { key: 'down', label: t('charts.status.down', 'Düşen'), count: buckets.down.length, color: DOWN, symbols: buckets.down },
            { key: 'flat', label: t('charts.status.flat', 'Yatay'), count: buckets.flat.length, color: FLAT, symbols: buckets.flat },
            { key: 'noData', label: t('charts.status.noData', 'Veri Yok'), count: buckets.noData.length, color: NODATA, symbols: buckets.noData }
        ];
    }, [portfolio, getDailyChange, t]);

    const noHoldingsLabel = t('holdings.noHoldings', '—');

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
                            formatter={(value, key) => [formatCurrency(value, currency, 2, 2), key === 'cost' ? t('charts.cost', 'Maliyet') : t('charts.marketValue', 'Piyasa Değeri')]}
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
                            content={<StatusTooltip noHoldingsLabel={noHoldingsLabel} />}
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
