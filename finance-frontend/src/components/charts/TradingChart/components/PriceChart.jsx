import React from 'react';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';

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
    const tooltipFormatter = (v) => isYield
        ? [`%${Number(v).toFixed(3)}`, t('yield')]
        : [formatPriceLabel(v), t('price')];

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
                        <XAxis dataKey="dateStr" stroke="#787b86" tick={{ fontSize: 11 }} />
                        <YAxis
                            stroke="#787b86"
                            orientation="right"
                            domain={['auto', 'auto']}
                            tickFormatter={yTickFormatter}
                        />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39' }}
                            formatter={tooltipFormatter}
                        />
                        <Area type="monotone" dataKey="close" stroke={stroke} strokeWidth={3} fillOpacity={1} fill="url(#colorClose)" />
                    </AreaChart>
                ) : (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                        <XAxis dataKey="dateStr" stroke="#787b86" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#787b86" orientation="right" tickFormatter={yTickFormatter} />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39' }}
                            formatter={tooltipFormatter}
                        />
                        <Line type="monotone" dataKey="close" stroke="#2962ff" strokeWidth={3} dot={false} />
                    </LineChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}
