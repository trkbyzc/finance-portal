import React from 'react';
import { Loader2, GitCompare } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { useTranslation } from 'react-i18next';
import { COMPARISON_COLORS, formatPriceLabel } from './comparisonHelpers';
import { formatChartDate } from '../../../../utils/formatters/dateFormatter';

/**
 * Recharts multi-line karşılaştırma grafiği. Asset'ler solid line, enflasyon overlay'leri kesik çizgi.
 * Boş state: orta yerde GitCompare ikonu + "henüz karşılaştırma yok" mesajı.
 */
export default function ComparisonChart({
    allActiveAssets, inflationSeries, chartData, isLoading, isPriceMode, currency
}) {
    const { t } = useTranslation('asset');

    if (allActiveAssets.length === 0) {
        return (
            <div className="w-full h-50 flex flex-col items-center justify-center text-text-muted border-2 border-dashed border-border rounded-xl">
                <GitCompare size={48} className="mb-3 opacity-20 text-primary" />
                <p>{t('comparison.noComparison')}</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div className="bg-surface-2 border border-border p-3 rounded-lg shadow-xl">
                <p className="text-text text-sm mb-2">{formatChartDate(label)}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-medium" style={{ color: entry.color }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="truncate max-w-[150px]">{entry.name}:</span>
                        <span>
                            {isPriceMode
                                ? formatPriceLabel(entry.value, currency)
                                : `${entry.value > 0 ? '+' : ''}${entry.value}%`}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full h-100 relative">
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 backdrop-blur-sm rounded-lg">
                    <Loader2 size={32} className="text-primary animate-spin mb-2" />
                </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickMargin={10} minTickGap={30} tickFormatter={formatChartDate} />
                    <YAxis
                        orientation="right"
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        domain={['auto', 'auto']}
                        scale={isPriceMode ? 'log' : 'linear'}
                        allowDataOverflow={false}
                        tickFormatter={(val) => isPriceMode ? formatPriceLabel(val, currency) : `${val > 0 ? '+' : ''}${val}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {!isPriceMode && <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />}

                    {allActiveAssets.map((ast, i) => (
                        <Line
                            key={ast.yahooSymbol}
                            type="monotone"
                            dataKey={ast.label}
                            name={ast.label}
                            stroke={COMPARISON_COLORS[i % COMPARISON_COLORS.length]}
                            strokeWidth={i === 0 ? 2.5 : 2}
                            dot={false}
                            activeDot={i === 0 ? { r: 6 } : false}
                            connectNulls
                        />
                    ))}
                    {inflationSeries.map(s => (
                        <Line
                            key={s.label}
                            type="monotone"
                            dataKey={s.label}
                            name={s.label}
                            stroke={s.color}
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            dot={false}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
