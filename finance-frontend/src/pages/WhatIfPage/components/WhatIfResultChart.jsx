import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { PALETTE, fmtTry } from '../whatIfHelpers';
import { formatChartDate } from '../../../utils/formatters/dateFormatter';

/**
 * Multi-line karşılaştırma grafiği.
 *
 * Ortak başlangıç tarihi (sharedStart):
 *   Backend her asset için historical data'da investmentDate'e EN YAKIN >= ilk noktayı bulur.
 *   Bu nokta asset bazında farklı çıkabilir (ALTNY.IS 02.02, USD 01.01, THYAO.IS 04.02).
 *   Tek grafiğe ayrı tarihlerden başlayan çizgiler kullanıcıyı yanıltır — "USD 1 ay önden
 *   başladı" gibi gözükür. Çözüm: assetlerin ilk-dolu-tarihlerinin EN GEÇ olanı sharedStart;
 *   tüm assetler oradan başlatılır. Hepsinin de orada datası garanti var.
 *
 * Mode toggle:
 *   - Endeks (default): sharedStart'taki değer 100, sonrası (v / base) * 100. Farklı
 *     büyüklükteki varlıklar birebir karşılaştırılır.
 *   - Mutlak: ham TRY portföy değeri. Tek bir büyük varlık (BTC) küçükleri ezer.
 */
export default function WhatIfResultChart({ result }) {
    const { t } = useTranslation('whatIf');
    const [mode, setMode] = useState('indexed'); // 'absolute' | 'indexed'

    const { chartData, sharedStart } = useMemo(() => {
        if (!result || !result.assets || result.assets.length === 0) {
            return { chartData: [], sharedStart: null };
        }

        // 1. Her asset'in ilk dolu noktasını bul.
        const firstDateByKey = new Map();
        result.assets.forEach((a) => {
            const firstPoint = (a.series || []).find(
                p => Number.isFinite(Number(p.value)) && Number(p.value) > 0
            );
            if (firstPoint) firstDateByKey.set(a.key, firstPoint.date);
        });

        // 2. sharedStart = en geç başlayan asset'in tarihi.
        //    (ISO yyyy-MM-dd string compare doğru sıralama yapar.)
        const firstDates = Array.from(firstDateByKey.values());
        const sharedStart = firstDates.length > 0
            ? firstDates.sort()[firstDates.length - 1]
            : null;

        // 3. Tarih bazında merge — sadece sharedStart >= satırlar.
        const dateMap = new Map();
        result.assets.forEach((a) => {
            (a.series || []).forEach(p => {
                if (sharedStart && p.date < sharedStart) return; // ortak başlangıç öncesini kes
                if (!dateMap.has(p.date)) dateMap.set(p.date, { date: p.date });
                dateMap.get(p.date)[a.key] = Number(p.value);
            });
        });
        const sorted = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        if (mode === 'absolute') return { chartData: sorted, sharedStart };

        // 4. Endeks mode: her asset'in sharedStart'taki değerini base al.
        //    sharedStart satırında her asset garantiyle var (en geç başlayan bile orada başlıyor).
        const baseByKey = new Map();
        if (sorted.length > 0) {
            const firstRow = sorted[0];
            result.assets.forEach((a) => {
                const v = firstRow[a.key];
                if (Number.isFinite(v) && v > 0) baseByKey.set(a.key, v);
            });
        }
        const indexed = sorted.map(row => {
            const next = { date: row.date };
            result.assets.forEach((a) => {
                const v = row[a.key];
                const base = baseByKey.get(a.key);
                if (Number.isFinite(v) && base) next[a.key] = (v / base) * 100;
            });
            return next;
        });
        return { chartData: indexed, sharedStart };
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

    // Bazı asset'in sharedStart'ı diğerlerinden çok geç ise kullanıcıya not düş.
    const sharedStartHint = useMemo(() => {
        if (!sharedStart || !result?.investmentDate) return null;
        if (sharedStart === result.investmentDate) return null;
        return t('chart.sharedStartHint', {
            date: formatChartDate(sharedStart),
            defaultValue: 'Karşılaştırma {{date}} tarihinden başlatıldı — bu tarihten önce bazı varlıkların verisi yok.'
        });
    }, [sharedStart, result, t]);

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div>
                    <h3 className="font-semibold">{t('chart.title')}</h3>
                    {mode === 'indexed' && (
                        <p className="text-xs text-text-muted mt-1 max-w-xl">{t('chart.indexedHint')}</p>
                    )}
                    {sharedStartHint && (
                        <p className="text-xs text-text-muted mt-1 max-w-xl">{sharedStartHint}</p>
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
