import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Gauge, ChevronDown, ChevronUp } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceArea
} from 'recharts';
import { stockApi } from '../../../../services/api/stockApi';
import { FG_ZONES, fgColor, fgLabel } from '../../../../utils/fearGreed';
import { formatChartDate } from '../../../../utils/formatters/dateFormatter';
import FearGreedGauge from './FearGreedGauge';

const RANGES = [
    { id: '30', days: 30, label: '30G' },
    { id: '365', days: 365, label: '1Y' },
    { id: 'all', days: null, label: 'Tümü' }
];

function FGTooltip({ active, payload, label, lang }) {
    if (!active || !payload || !payload.length) return null;
    const v = payload[0].value;
    return (
        <div className="bg-surface-2 border border-border p-2.5 rounded-lg shadow-xl text-xs">
            <p className="text-text-muted mb-1">{formatChartDate(label)}</p>
            <p className="font-bold flex items-center gap-1.5" style={{ color: fgColor(v) }}>
                <span className="w-2 h-2 rounded-full" style={{ background: fgColor(v) }} />
                {v} · {fgLabel(v, null, lang)}
            </p>
        </div>
    );
}

function HistRow({ label, item, lang }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">{label}</span>
            {item ? (
                <span className="font-bold px-2.5 py-1 rounded-md text-[12px]"
                      style={{ color: fgColor(item.value), background: `${fgColor(item.value)}1a` }}>
                    {fgLabel(item.value, item.classification, lang)} · {item.value}
                </span>
            ) : <span className="text-text-muted">—</span>}
        </div>
    );
}

function MiniStat({ label, value }) {
    return (
        <div className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</div>
            <div className="text-lg font-black" style={{ color: value != null ? fgColor(value) : 'var(--color-text)' }}>
                {value != null ? value : '—'}
            </div>
        </div>
    );
}

/**
 * Crypto Fear & Greed Index paneli — kripto detay sayfasına EK (toggle butonla açılır).
 * Sol: gauge (anlık değer) + geçmiş değerler + yıllık yüksek/düşük. Sağ: zone bantlı çizgi grafik
 * (30G/1Y/Tümü). Veri: /api/v1/market-data/fear-greed (alternative.me, market geneli — coin bağımsız).
 */
export default function FearGreedPanel() {
    const { t, i18n } = useTranslation(['asset', 'common']);
    const lang = i18n.language?.startsWith('en') ? 'en' : 'tr';
    const [open, setOpen] = useState(false);
    const [range, setRange] = useState('365');

    const { data: series = [], isLoading } = useQuery({
        queryKey: ['fearGreed'],
        queryFn: async () => {
            const r = await stockApi.getFearGreed();
            return Array.isArray(r) ? r : (r?.data || []);
        },
        enabled: open,
        staleTime: 60 * 60 * 1000
    });

    const n = series.length;
    const current = n ? series[n - 1] : null;
    const at = (back) => (n > back ? series[n - 1 - back] : null);
    const yearSlice = useMemo(() => series.slice(Math.max(0, n - 365)), [series, n]);
    const yHigh = yearSlice.length ? Math.max(...yearSlice.map(d => d.value)) : null;
    const yLow = yearSlice.length ? Math.min(...yearSlice.map(d => d.value)) : null;

    const chartData = useMemo(() => {
        const days = RANGES.find(r => r.id === range)?.days;
        const sliced = days ? series.slice(Math.max(0, n - days)) : series;
        return sliced.map(d => ({ t: d.timestamp * 1000, value: d.value }));
    }, [series, range, n]);

    return (
        <div className="mb-8">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-surface border border-border hover:border-primary/50 text-text font-bold transition-all shadow-sm"
            >
                <Gauge size={18} className="text-primary" />
                <span>{t('asset:fearGreed.title', 'Fear & Greed Endeksi')}</span>
                <span className="text-text-muted text-xs font-normal hidden sm:inline">{t('asset:fearGreed.subtitle', '· Kripto piyasa duyarlılığı')}</span>
                {open ? <ChevronUp size={18} className="ml-auto text-text-muted" /> : <ChevronDown size={18} className="ml-auto text-text-muted" />}
            </button>

            {open && (
                <div className="bg-surface border border-border rounded-3xl p-5 md:p-6 mt-3 shadow-lg">
                    {isLoading ? (
                        <div className="h-72 animate-pulse bg-surface-2 rounded-2xl" />
                    ) : !current ? (
                        <div className="h-32 flex items-center justify-center text-text-muted text-sm">{t('common:status.noData')}</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
                            {/* Sol: gauge + geçmiş */}
                            <div>
                                <FearGreedGauge value={current.value} label={fgLabel(current.value, current.classification, lang)} />
                                <div className="mt-4 space-y-2.5">
                                    <HistRow label={t('asset:fearGreed.yesterday', 'Dün')} item={at(1)} lang={lang} />
                                    <HistRow label={t('asset:fearGreed.lastWeek', 'Geçen Hafta')} item={at(7)} lang={lang} />
                                    <HistRow label={t('asset:fearGreed.lastMonth', 'Geçen Ay')} item={at(30)} lang={lang} />
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <MiniStat label={t('asset:fearGreed.yearHigh', 'Yıllık Yüksek')} value={yHigh} />
                                    <MiniStat label={t('asset:fearGreed.yearLow', 'Yıllık Düşük')} value={yLow} />
                                </div>
                            </div>

                            {/* Sağ: zone bantlı çizgi grafik */}
                            <div>
                                <div className="flex items-center justify-end gap-1 mb-2">
                                    {RANGES.map(r => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setRange(r.id)}
                                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                                                range === r.id ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-text-muted hover:text-text'
                                            }`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                                        <defs>
                                            <linearGradient id="fgFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#787b86" stopOpacity={0.25} />
                                                <stop offset="100%" stopColor="#787b86" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                        {FG_ZONES.map(z => (
                                            <ReferenceArea key={z.min} y1={z.min} y2={z.max} fill={z.color} fillOpacity={0.08} ifOverflow="extendDomain" />
                                        ))}
                                        <XAxis dataKey="t" stroke="#787b86" tick={{ fontSize: 11 }} minTickGap={50} tickFormatter={formatChartDate} />
                                        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} stroke="#787b86" tick={{ fontSize: 11 }} />
                                        <RechartsTooltip content={<FGTooltip lang={lang} />} />
                                        <Area type="monotone" dataKey="value" stroke="#787b86" strokeWidth={2} fill="url(#fgFill)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
