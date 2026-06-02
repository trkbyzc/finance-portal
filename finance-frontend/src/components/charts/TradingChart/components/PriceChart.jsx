import React from 'react';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { formatChartDate } from '../../../../utils/formatters/dateFormatter';

/**
 * Karşılaştırma grafiğiyle aynı açık (beyaz) tooltip — siyah kutu yerine.
 * Modül seviyesinde tanımlı; recharts `content` element'ine ekstra prop'lar geçer,
 * active/payload/label'ı kendisi enjekte eder.
 */
function PriceTooltip({ active, payload, label, stroke, isYield, t, formatPriceLabel }) {
    if (!active || !payload || !payload.length) return null;
    const v = payload[0].value;
    return (
        <div className="bg-surface-2 border border-border p-3 rounded-lg shadow-xl">
            <p className="text-text text-sm mb-1">{formatChartDate(label)}</p>
            <p className="text-sm font-bold flex items-center gap-2" style={{ color: stroke }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stroke }} />
                {isYield
                    ? `${t('yield')}: %${Number(v).toFixed(3)}`
                    : `${t('price')}: ${formatPriceLabel(v)}`}
            </p>
        </div>
    );
}

/**
 * Recharts area veya line chart (klinecharts kullanılmadığı modlarda).
 * useAreaChart=true ise gradient'li alan, false ise düz çizgi.
 * isYield asset (bond) yüzde formatlı eksen kullanır.
 */
export default function PriceChart({
    chartData, useAreaChart, isEurobond, isYield, formatPriceLabel
}) {
    const { t } = useTranslation('charts');

    const stroke = isEurobond ? '#ff9800' : '#2962ff';
    const yTickFormatter = (v) => isYield ? `%${v.toFixed(2)}` : formatPriceLabel(v);
    const tooltipEl = <PriceTooltip stroke={stroke} isYield={isYield} t={t} formatPriceLabel={formatPriceLabel} />;

    return (
        <div className="w-full h-full p-4">
            <ResponsiveContainer width="100%" height="100%">
                {useAreaChart ? (
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={stroke} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={stroke} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                        <XAxis dataKey="dateStr" stroke="#787b86" tick={{ fontSize: 11 }} tickFormatter={formatChartDate} />
                        <YAxis
                            stroke="#787b86"
                            orientation="right"
                            domain={['auto', 'auto']}
                            tickFormatter={yTickFormatter}
                        />
                        <RechartsTooltip content={tooltipEl} />
                        <Area type="monotone" dataKey="close" stroke={stroke} strokeWidth={3} fillOpacity={1} fill="url(#colorClose)" />
                    </AreaChart>
                ) : (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                        <XAxis dataKey="dateStr" stroke="#787b86" tick={{ fontSize: 11 }} tickFormatter={formatChartDate} />
                        <YAxis stroke="#787b86" orientation="right" tickFormatter={yTickFormatter} />
                        <RechartsTooltip content={tooltipEl} />
                        <Line type="monotone" dataKey="close" stroke="#2962ff" strokeWidth={3} dot={false} />
                    </LineChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}
