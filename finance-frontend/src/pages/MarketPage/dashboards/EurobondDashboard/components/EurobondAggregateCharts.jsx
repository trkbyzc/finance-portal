import React from 'react';
import { PieChart as PieIcon } from 'lucide-react';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { ChartCard, COLOR_PRIMARY, COLOR_USD, COLOR_EUR, COLOR_JPY, COLOR_OTHER } from './eurobondShared';

/**
 * 3 aggregate chart: yıllara göre toplam stock (bar), para birimi mix (pie),
 * vadeye göre dağılım (yatay bar). aggregate yoksa empty state.
 */
const CurrencyTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
        <div className="bg-bg border border-border px-3 py-2 rounded text-xs">
            <div className="text-text-muted">{p.name}</div>
            <div className="font-mono font-bold" style={{ color: p.payload.fill || p.color }}>%{Number(p.value).toFixed(1)}</div>
        </div>
    );
};

export default function EurobondAggregateCharts({ aggregate, hasAggregate }) {
    const { t } = useTranslation(['markets', 'common']);

    if (!hasAggregate) {
        return (
            <div className="bg-surface border border-border rounded-2xl p-12 text-center text-text-muted mb-10">
                <PieIcon size={40} className="mx-auto mb-3 opacity-40" />
                <div className="font-semibold mb-1 text-text">{t('common:status.noData')}</div>
                <div className="text-sm">{t('common:status.comingSoon')}</div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <ChartCard title={t('markets:eurobonds.totalStock')} subtitle="USD M">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={aggregate.totalStockByYear}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                        <XAxis dataKey="year" stroke="#787b86" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#787b86" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}B`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39' }}
                            formatter={(v) => [`${Number(v).toLocaleString()} M$`, t('markets:eurobonds.totalStock')]}
                        />
                        <Bar dataKey="value" fill={COLOR_PRIMARY} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t('markets:eurobonds.currencyMix')} subtitle="%">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={aggregate.currencyMix}
                            dataKey="value"
                            nameKey="currency"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={(e) => `${e.currency} %${Number(e.value).toFixed(1)}`}
                            labelLine={false}
                        >
                            {(aggregate.currencyMix || []).map((entry, idx) => (
                                <Cell key={idx} fill={
                                    entry.currency === 'USD' ? COLOR_USD :
                                    entry.currency === 'EUR' ? COLOR_EUR :
                                    entry.currency === 'JPY' ? COLOR_JPY : COLOR_OTHER
                                } />
                            ))}
                        </Pie>
                        <Tooltip content={<CurrencyTooltip />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t('markets:eurobonds.maturityMix')} subtitle="%" wide>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={aggregate.maturityMix} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" horizontal={false} />
                        <XAxis type="number" stroke="#787b86" tick={{ fontSize: 11 }} tickFormatter={(v) => `%${v}`} />
                        <YAxis type="category" dataKey="bucket" stroke="#787b86" tick={{ fontSize: 11 }} width={120} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39' }}
                            formatter={(v) => [`%${Number(v).toFixed(1)}`, '%']}
                        />
                        <Bar dataKey="value" fill={COLOR_PRIMARY} radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}
