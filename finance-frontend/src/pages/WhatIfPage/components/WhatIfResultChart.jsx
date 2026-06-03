import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { PALETTE, fmtTry } from '../whatIfHelpers';
import { formatChartDate } from '../../../utils/formatters/dateFormatter';

/**
 * Multi-line karşılaştırma grafiği. result.assets'in series'lerini tarih bazında merge eder,
 * her asset için ayrı renkte bir Line render eder. connectNulls=true ki downsample'dan
 * sonra tarih setleri ayrıştığında bile çizgi kopmasın.
 *
 * Custom tooltip: hover anında o tarihteki TÜM asset değerlerini gösterir; veri yoksa
 * (downsample / başlangıç gecikmesi) "—" yazılır — kullanıcı boş kalan asset'leri ayırt eder.
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

    // Asset listesi tooltip'in tüm satırları için (boş olanları da göstermek için)
    const assetList = result?.assets || [];

    const renderTooltip = ({ active, label, payload }) => {
        if (!active || !label) return null;
        // payload sadece DOLU değerleri içerir → asset listesi üzerinden dön, eksikleri "—" göster
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
                                {v == null ? '—' : `${fmtTry(v)} ₺`}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
            <h3 className="font-semibold mb-3">{t('chart.title')}</h3>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="date" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} tickFormatter={formatChartDate} />
                        <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
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
