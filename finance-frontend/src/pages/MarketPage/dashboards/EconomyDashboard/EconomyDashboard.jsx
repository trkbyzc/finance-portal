import { useMemo, useState } from 'react';
import { ArrowLeft, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { economyApi } from '../../../../services/api';
import { formatChartDate } from '../../../../utils/formatters/dateFormatter';

// Kategori sırası (frontend gruplaması) — backend indicator.category ile eşleşir
const CATEGORY_ORDER = ['inflation', 'rates', 'growth', 'external', 'fx', 'labor', 'budget', 'activity', 'market', 'global'];
const RANGES = ['1y', '5y', '10y'];

// US enflasyonu EVDS değil FRED — sidebar'a ekstra olarak eklenir
const US_INFLATION = { key: 'usInflation', category: 'global', unit: '' };

export default function EconomyDashboard() {
    const navigate = useNavigate();
    const { t } = useTranslation(['markets', 'common', 'asset']);
    const [selected, setSelected] = useState('inflationRate');
    const [range, setRange] = useState('10y');

    const { data: indicators = [] } = useQuery({
        queryKey: ['economy-indicators'],
        queryFn: async () => (await economyApi.getIndicators()) || []
    });

    const allIndicators = useMemo(() => {
        const list = [...indicators];
        if (!list.some(i => i.key === US_INFLATION.key)) list.push(US_INFLATION);
        return list;
    }, [indicators]);

    const selectedMeta = useMemo(
        () => allIndicators.find(i => i.key === selected) || { key: selected, unit: '' },
        [allIndicators, selected]
    );

    const grouped = useMemo(() => {
        const map = new Map();
        for (const ind of allIndicators) {
            if (!map.has(ind.category)) map.set(ind.category, []);
            map.get(ind.category).push(ind);
        }
        return CATEGORY_ORDER.filter(c => map.has(c)).map(c => ({ category: c, items: map.get(c) }));
    }, [allIndicators]);

    const { data: series = [], isLoading } = useQuery({
        queryKey: ['economy-series', selected, range],
        queryFn: async () => {
            const res = selected === 'usInflation'
                ? await economyApi.getEconomyUsHistorical(range)
                : await economyApi.getHistoricalEconomy(selected, range);
            const arr = Array.isArray(res) ? res : (res?.data || []);
            return arr
                .filter(p => p && p.value != null && p.date)
                .map(p => ({ date: p.date, value: Number(p.value) }))
                .filter(p => !Number.isNaN(p.value));
        }
    });

    const unit = selectedMeta.unit || '';
    const fmtVal = (v) => {
        if (v == null || Number.isNaN(v)) return '';
        const n = Number(v);
        const num = n.toLocaleString('tr-TR', { maximumFractionDigits: Math.abs(n) < 100 ? 2 : 0 });
        if (unit === '%') return `%${num}`;
        if (unit === '₺' || unit === '$') return `${unit}${num}`;
        return unit ? `${num} ${unit}` : num;
    };

    return (
        <div className="min-h-screen bg-bg text-text">
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-text-muted hover:text-text mb-6 transition bg-surface-2 px-4 py-2 rounded-lg border border-border"
            >
                <ArrowLeft size={18} /> {t('asset:back')}
            </button>

            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-text tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-primary rounded-full"></span>
                    {t('markets:economyDash.headerTitle')}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sol: gösterge listesi (kategorili) */}
                <aside className="lg:col-span-1 bg-surface border border-border rounded-2xl p-4 shadow-xl max-h-[720px] overflow-y-auto custom-scrollbar">
                    {grouped.map(group => (
                        <div key={group.category} className="mb-4">
                            <div className="text-[10px] font-black uppercase tracking-wider text-text-muted px-2 mb-1">
                                {t(`markets:economyDash.categories.${group.category}`)}
                            </div>
                            {group.items.map(ind => (
                                <button
                                    key={ind.key}
                                    onClick={() => setSelected(ind.key)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition mb-0.5 ${
                                        selected === ind.key
                                            ? 'bg-primary/15 text-primary border border-primary/30'
                                            : 'text-text-muted hover:text-text hover:bg-surface-2 border border-transparent'
                                    }`}
                                >
                                    {t(`markets:economyDash.metrics.${ind.key}`)}
                                </button>
                            ))}
                        </div>
                    ))}
                </aside>

                {/* Sağ: grafik */}
                <section className="lg:col-span-3 bg-surface border border-border rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Activity className="text-primary" size={20} />
                            <div>
                                <div className="text-lg font-bold text-text">{t(`markets:economyDash.metrics.${selected}`)}</div>
                                <div className="text-xs text-text-muted">{t('markets:economyDash.source')}</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {RANGES.map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                        range === r ? 'bg-primary text-text' : 'bg-surface-2 text-text-muted hover:text-text border border-border'
                                    }`}
                                >
                                    {t(`common:ranges.${r}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 min-h-[420px]">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center text-text-muted">{t('common:status.loading')}</div>
                        ) : !series.length ? (
                            <div className="h-full flex items-center justify-center text-text-muted">{t('common:status.noData')}</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" minHeight={420}>
                                <LineChart data={series} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="var(--color-text-muted)"
                                        tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                        minTickGap={48}
                                        tickFormatter={formatChartDate}
                                    />
                                    <YAxis
                                        stroke="var(--color-text-muted)"
                                        tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                                        orientation="right"
                                        domain={['auto', 'auto']}
                                        tickFormatter={(v) => fmtVal(v)}
                                        width={70}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--color-surface)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 8,
                                            fontSize: 12,
                                            color: 'var(--color-text)'
                                        }}
                                        labelStyle={{ color: 'var(--color-text-muted)' }}
                                        itemStyle={{ color: 'var(--color-text)' }}
                                        labelFormatter={(d) => formatChartDate(d)}
                                        formatter={(v) => [fmtVal(v), t(`markets:economyDash.metrics.${selected}`)]}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <p className="mt-3 text-[11px] text-text-muted">{t('markets:economyDash.note')}</p>
                </section>
            </div>
          </div>
        </div>
    );
}
