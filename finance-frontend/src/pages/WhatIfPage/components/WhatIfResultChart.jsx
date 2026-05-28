import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { PALETTE, fmtTry } from '../whatIfHelpers';

/**
 * Multi-line karşılaştırma grafiği. result.assets'in series'lerini tarih bazında merge eder,
 * her asset için ayrı renkte bir Line render eder. connectNulls=true ki downsample'dan
 * sonra tarih setleri ayrıştığında bile çizgi kopmasın.
 */
export default function WhatIfResultChart({ result }) {
    const { t } = useTranslation('whatIf');

    const chartData = useMemo(() => {
        if (!result || !result.assets || result.assets.length === 0) return [];
        const dateMap = new Map();
        result.assets.forEach((a) => {
            (a.series || []).forEach(p => {
                if (!dateMap.has(p.date)) dateMap.set(p.date, { date: p.date });
                dateMap.get(p.date)[a.key] = Number(p.value);
            });
        });
        return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [result]);

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
            <h3 className="font-semibold mb-3">{t('chart.title')}</h3>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="date" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                        <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                        <Tooltip
                            contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                            labelStyle={{ color: 'var(--color-text-muted)' }}
                            formatter={(v) => `${fmtTry(v)} ₺`}
                        />
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
