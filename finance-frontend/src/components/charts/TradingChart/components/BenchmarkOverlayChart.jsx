import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { ASSET_COLOR } from '../tradingChartConstants';

/**
 * Asset + 1+ benchmark'in % normalize edilmiş multi-area karşılaştırma grafiği.
 * BIST overlay ve crypto BITW overlay aynı render bloğunu kullanır — sadece data source farklı.
 */
export default function BenchmarkOverlayChart({ overlayChartData, overlayBenchmarks, displayName }) {
    return (
        <div key="benchmark-overlay" className="absolute top-2 left-2 right-2 bottom-2 p-4 bg-surface">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overlayChartData}>
                    <defs>
                        <linearGradient id="overlayAssetFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={ASSET_COLOR} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={ASSET_COLOR} stopOpacity={0} />
                        </linearGradient>
                        {overlayBenchmarks.map(b => (
                            <linearGradient key={b.key} id={`bench-${b.key}-fill`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={b.color} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={b.color} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                    <XAxis dataKey="date" stroke="#787b86" tick={{ fontSize: 11 }} minTickGap={40} />
                    <YAxis
                        stroke="#787b86"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                        domain={['auto', 'auto']}
                        tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
                    />
                    <RechartsTooltip
                        contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39' }}
                        formatter={(v, name) => [`${v > 0 ? '+' : ''}${Number(v).toFixed(2)}%`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={0} stroke="#868993" strokeDasharray="3 3" />
                    <Area
                        type="monotone" dataKey="asset" name={displayName}
                        stroke={ASSET_COLOR} strokeWidth={2.5} fillOpacity={1} fill="url(#overlayAssetFill)" connectNulls
                    />
                    {overlayBenchmarks.map(b => (
                        <Area
                            key={b.key} type="monotone" dataKey={b.key} name={b.label}
                            stroke={b.color} strokeWidth={2} fillOpacity={1} fill={`url(#bench-${b.key}-fill)`} connectNulls
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
