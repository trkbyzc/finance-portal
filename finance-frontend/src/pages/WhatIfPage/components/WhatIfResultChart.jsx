import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { PALETTE, fmtTry } from '../whatIfHelpers';
import { formatChartDate } from '../../../utils/formatters/dateFormatter';

/**
 * Multi-line karşılaştırma grafiği. result.assets'in series'lerini tarih bazında merge eder,
 * her asset için ayrı renkte bir Line render eder. connectNulls=true ki downsample'dan
 * sonra tarih setleri ayrıştığında bile çizgi kopmasın.
 *
 * Mode toggle (Mutlak vs Endeks):
 *   - Mutlak: ham TRY değeri (örn. 1 BTC = 67.000 ₺, 1 hisse = 5,5 ₺)
 *     Sorun: küçük varlık BTC'nin yanında X eksenine ezilir, görünmez.
 *   - Endeks (default): her serinin ilk dolu noktası 100 puana sabitlenir,
 *     sonraki noktalar oransal olarak (value / firstValue) * 100 ile ölçeklenir.
 *     Büyüklük farkı silinir, getiri farkları çıplak gözle karşılaştırılabilir.
 */
export default function WhatIfResultChart({ result }) {
    const { t } = useTranslation('whatIf');
    const [mode, setMode] = useState('indexed'); // 'absolute' | 'indexed'

    const chartData = useMemo(() => {
        if (!result || !result.assets || result.assets.length === 0) return [];
        // 1. Tarih bazında merge — her satırda her asset için bir değer veya undefined
        const dateMap = new Map();
        result.assets.forEach((a) => {
            (a.series || []).forEach(p => {
                if (!dateMap.has(p.date)) dateMap.set(p.date, { date: p.date });
                dateMap.get(p.date)[a.key] = Number(p.value);
            });
        });
        const sorted = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        if (mode === 'absolute') return sorted;

        // 2. Endeks modunda her asset için ilk dolu değeri bul, sonra (v / first) * 100
        const firstValueByKey = new Map();
        result.assets.forEach((a) => {
            const firstPoint = (a.series || []).find(p => Number.isFinite(Number(p.value)) && Number(p.value) > 0);
            if (firstPoint) firstValueByKey.set(a.key, Number(firstPoint.value));
        });
        return sorted.map(row => {
            const next = { date: row.date };
            result.assets.forEach((a) => {
                const v = row[a.key];
                const base = firstValueByKey.get(a.key);
                if (v != null && base) next[a.key] = (v / base) * 100;
            });
            return next;
        });
    }, [result, mode]);

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

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div>
                    <h3 className="font-semibold">{t('chart.title')}</h3>
                    {mode === 'indexed' && (
                        <p className="text-xs text-text-muted mt-1 max-w-xl">{t('chart.indexedHint')}</p>
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
                        <XAxis dataKey="date" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} tickFormatter={formatChartDate} />
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
