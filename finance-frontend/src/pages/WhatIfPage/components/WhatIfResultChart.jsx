import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Info, CalendarClock } from 'lucide-react';
import { PALETTE, fmtTry, buildComparisonSeries } from '../whatIfHelpers';
import { formatChartDate } from '../../../utils/formatters/dateFormatter';

/**
 * Multi-line karşılaştırma grafiği.
 *
 * Veri hazırlığı (interpolasyonla hizalama, sharedStart, endeks/mutlak) tamamen saf
 * buildComparisonSeries() helper'ında — orada test ediliyor. Burada sadece render + tooltip.
 *
 * Mode toggle:
 *   - Endeks (default): her varlık sharedStart'ta 100, sonrası (v / base) * 100. Farklı
 *     büyüklükteki varlıklar birebir karşılaştırılır.
 *   - Mutlak: ham TRY portföy değeri. Tek bir büyük varlık (BTC) küçükleri ezer.
 */
export default function WhatIfResultChart({ result }) {
    const { t } = useTranslation('whatIf');
    const [mode, setMode] = useState('indexed'); // 'absolute' | 'indexed'

    // Tüm transform (interpolasyonla hizalama + endeks) saf helper'da → test edilebilir.
    const { chartData, sharedStart, limitingLabel } = useMemo(
        () => buildComparisonSeries(result, mode),
        [result, mode]
    );

    const assetList = result?.assets || [];

    const formatValue = (v) => {
        if (v == null) return '—';
        if (mode === 'indexed') return v.toFixed(2);
        return `${fmtTry(v)} ₺`;
    };

    const renderTooltip = ({ active, label, payload }) => {
        if (!active || !label) return null;
        const valueByKey = new Map();
        (payload || []).forEach(p => valueByKey.set(p.dataKey, p.value));
        return (
            <div
                style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    minWidth: 180,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
            >
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 6 }}>
                    {formatChartDate(label)}
                </div>
                {assetList.map((a, idx) => {
                    const v = valueByKey.get(a.key);
                    const color = PALETTE[idx % PALETTE.length];
                    return (
                        <div key={a.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 12, padding: '2px 0' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                                <span style={{ color: 'var(--color-text)' }}>{a.label || a.symbol}</span>
                            </span>
                            <span style={{ color: v == null ? 'var(--color-text-muted)' : 'var(--color-text)', fontWeight: 600 }}>
                                {formatValue(v)}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // sharedStart yatırım tarihinden geç ise: tarihi ayrı vurgulu chip'te, açıklamayı yanında göster.
    const startHint = useMemo(() => {
        if (!sharedStart || !result?.investmentDate) return null;
        if (sharedStart === result.investmentDate) return null;
        return {
            date: formatChartDate(sharedStart),
            text: t('chart.sharedStartHint', {
                asset: limitingLabel || '',
                defaultValue: '{{asset}} verisi bu tarihte başlıyor; daha öncesi olmadığı için karşılaştırma buradan başlatıldı.'
            })
        };
    }, [sharedStart, result, limitingLabel, t]);

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div>
                    <h3 className="font-semibold">{t('chart.title')}</h3>
                    {mode === 'indexed' && (
                        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-text-subtle max-w-xl leading-relaxed">
                            <Info size={13} className="mt-0.5 shrink-0" />
                            <span>{t('chart.indexedHint')}</span>
                        </p>
                    )}
                    {startHint && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg border border-primary/25 bg-primary-soft px-3 py-2 max-w-xl">
                            <CalendarClock size={15} className="mt-0.5 shrink-0 text-primary" />
                            <p className="text-xs leading-relaxed text-text-muted">
                                <span className="mr-1.5 inline-block rounded-md bg-primary px-1.5 py-0.5 align-middle font-mono text-[11px] font-bold text-primary-fg">
                                    {startHint.date}
                                </span>
                                {startHint.text}
                            </p>
                        </div>
                    )}
                </div>
                <div className="inline-flex rounded-lg border border-border overflow-hidden text-xs font-semibold shrink-0">
                    <button
                        type="button"
                        onClick={() => setMode('indexed')}
                        className={`px-3 py-1.5 transition-colors ${mode === 'indexed' ? 'bg-primary text-primary-fg' : 'bg-transparent text-text-muted hover:text-text'}`}
                    >
                        {t('chart.modeIndexed')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('absolute')}
                        className={`px-3 py-1.5 transition-colors ${mode === 'absolute' ? 'bg-primary text-primary-fg' : 'bg-transparent text-text-muted hover:text-text'}`}
                    >
                        {t('chart.modeAbsolute')}
                    </button>
                </div>
            </div>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis
                            dataKey="date"
                            stroke="var(--color-text-muted)"
                            tick={{ fontSize: 11 }}
                            tickFormatter={formatChartDate}
                            interval="preserveStartEnd"
                            minTickGap={40}
                        />
                        <YAxis
                            stroke="var(--color-text-muted)"
                            tick={{ fontSize: 11 }}
                            domain={mode === 'indexed' ? ['auto', 'auto'] : [0, 'auto']}
                            tickFormatter={(v) => mode === 'indexed' ? v.toFixed(0) : Math.round(v).toLocaleString('tr-TR')}
                        />
                        <Tooltip content={renderTooltip} />
                        <Legend />
                        {result.assets.map((a, idx) => (
                            <Line
                                key={a.key}
                                type="monotone"
                                dataKey={a.key}
                                name={a.label || a.symbol}
                                stroke={PALETTE[idx % PALETTE.length]}
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
