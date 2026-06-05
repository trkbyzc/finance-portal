import React from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceArea
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { FG_ZONES, fgColor, fgLabel } from '../../../../utils/fearGreed';
import { formatChartDate } from '../../../../utils/formatters/dateFormatter';

const FNG_COLOR = '#f7931a'; // F&G çizgisi (turuncu — fiyat çizgisi grinin yanında ayrışsın)

const fmtPriceAxis = (v) => {
    if (v == null || !Number.isFinite(v)) return '';
    if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
    return `$${Number(v).toFixed(v < 1 ? 4 : 2)}`;
};

function FGOverlayTooltip({ active, payload, label, lang, displayName }) {
    if (!active || !payload || !payload.length) return null;
    const price = payload.find(p => p.dataKey === 'price')?.value;
    const fng = payload.find(p => p.dataKey === 'fng')?.value;
    return (
        <div className="bg-surface-2 border border-border p-3 rounded-lg shadow-xl text-xs">
            <p className="text-text mb-2">{formatChartDate(label)}</p>
            {price != null && (
                <p className="font-bold flex items-center gap-2 mb-1" style={{ color: '#787b86' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: '#787b86' }} />
                    {displayName}: {fmtPriceAxis(price)}
                </p>
            )}
            {fng != null && (
                <p className="font-bold flex items-center gap-2" style={{ color: fgColor(fng) }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: fgColor(fng) }} />
                    F&G: {fng} · {fgLabel(fng, null, lang)}
                </p>
            )}
        </div>
    );
}

/**
 * Fear & Greed karşılaştırma overlay'i — BITW mantığıyla aynı (toggle ile grafiği değiştirir).
 * Sol eksen: varlık fiyatı (gri çizgi). Sağ eksen: F&G 0-100 (turuncu çizgi) + zone bantları/etiketleri.
 */
export default function FearGreedOverlayChart({ data, displayName }) {
    const { i18n } = useTranslation();
    const lang = i18n.language?.startsWith('en') ? 'en' : 'tr';

    return (
        <div key="fng-overlay" className="absolute top-2 left-2 right-2 bottom-2 p-4 bg-surface">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                    {FG_ZONES.map((z) => (
                        <ReferenceArea
                            key={z.min}
                            yAxisId="fng"
                            y1={z.min}
                            y2={z.max}
                            fill={z.color}
                            fillOpacity={0.08}
                            ifOverflow="extendDomain"
                            label={{ value: lang === 'en' ? z.label : z.tr, position: 'insideRight', fill: '#868993', fontSize: 10 }}
                        />
                    ))}
                    <XAxis dataKey="date" stroke="#787b86" tick={{ fontSize: 11 }} minTickGap={50} tickFormatter={formatChartDate} />
                    <YAxis yAxisId="price" orientation="left" stroke="#787b86" tick={{ fontSize: 11 }} domain={['auto', 'auto']} tickFormatter={fmtPriceAxis} width={52} />
                    <YAxis yAxisId="fng" orientation="right" stroke="#787b86" tick={{ fontSize: 11 }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} width={32} />
                    <RechartsTooltip content={<FGOverlayTooltip lang={lang} displayName={displayName} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line yAxisId="price" type="monotone" dataKey="price" name={displayName} stroke="#787b86" strokeWidth={2} dot={false} connectNulls />
                    <Line yAxisId="fng" type="monotone" dataKey="fng" name="Fear & Greed" stroke={FNG_COLOR} strokeWidth={2.5} dot={false} connectNulls />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
