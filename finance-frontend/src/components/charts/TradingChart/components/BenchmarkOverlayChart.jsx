import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { ASSET_COLOR } from '../tradingChartConstants';
import { formatChartDate } from '../../../../utils/formatters/dateFormatter';

/**
 * Asset + 1+ benchmark'in % normalize edilmiş multi-area karşılaştırma grafiği.
 * BIST overlay ve crypto BITW overlay aynı render bloğunu kullanır — sadece data source farklı.
 */
/**
 * Karşılaştırma grafiğindekiyle aynı açık tooltip (siyah kutu yerine) —
 * bg-surface-2 + renkli nokta + "ad: +%xx" satırları.
 */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-surface-2 border border-border p-3 rounded-lg shadow-xl">
            <p className="text-text text-sm mb-2">{formatChartDate(label)}</p>
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-sm font-medium" style={{ color: entry.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="truncate max-w-37.5">{entry.name}:</span>
                    <span>{entry.value > 0 ? '+' : ''}{Number(entry.value).toFixed(2)}%</span>
                </div>
            ))}
        </div>
    );
}

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
                    <XAxis dataKey="date" stroke="#787b86" tick={{ fontSize: 11 }} minTickGap={40} tickFormatter={formatChartDate} />
                    <YAxis
                        stroke="#787b86"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                        domain={['auto', 'auto']}
                        tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
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
