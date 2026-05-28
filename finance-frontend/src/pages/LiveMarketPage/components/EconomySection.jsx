import React from 'react';
import { ChevronRight, Loader2, TrendingUp, Users, Percent } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

const CustomEconomyTooltip = ({ active, payload, label, economyMetric }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-bg border border-border p-3 rounded-xl shadow-2xl">
                <p className="text-text-muted text-[10px] font-bold mb-1 uppercase tracking-wider">{label}</p>
                <p className="text-buy text-lg font-mono font-black">
                    {Number(payload[0].value).toFixed(2)}<span className="text-[10px] ml-1">{economyMetric === 'population' ? 'M' : '%'}</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function EconomySection({ economyMacro, economyMetric, setEconomyMetric, economyRange, setEconomyRange, economyData, economyLoading }) {
    const { t } = useTranslation(['markets', 'common']);

    const dynamicEconomyMetrics = [
        { id: 'interestRate', label: t('markets:live.interestRate'), value: economyMacro?.interestRate ? `${economyMacro.interestRate}%` : '-%', icon: <Percent size={18} /> },
        { id: 'inflationRate', label: t('markets:live.inflationRate'), value: economyMacro?.inflationRate ? `${economyMacro.inflationRate}%` : '-%', icon: <TrendingUp size={18} /> },
        { id: 'unemploymentRate', label: t('markets:live.unemploymentRate'), value: economyMacro?.unemploymentRate ? `${economyMacro.unemploymentRate}%` : '-%', icon: <Users size={18} /> }
    ];

    const ranges = [
        { key: '1y', value: '1y' },
        { key: '5y', value: '5y' },
        { key: '10y', value: '10y' }
    ];

    return (
        <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                {t('markets:live.economy')} <ChevronRight className="text-text-muted" size={24} />
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
                {dynamicEconomyMetrics.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setEconomyMetric(m.id)}
                        className={`p-6 rounded-2xl border transition-all duration-300 text-left group ${economyMetric === m.id ? 'bg-surface-2 border-primary ring-1 ring-[#2962ff]' : 'bg-surface border-border hover:border-border-strong'}`}
                    >
                        <div className="text-[10px] font-black text-text-muted mb-1 uppercase tracking-widest">{m.label}</div>
                        <div className="text-2xl font-mono font-bold flex items-center justify-between text-text">
                            {m.value}
                            <div className={`p-2 rounded-lg transition-colors ${economyMetric === m.id ? 'bg-primary/20 text-primary' : 'bg-surface-hover text-text-muted group-hover:text-text'}`}>{m.icon}</div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="bg-surface border border-border rounded-3xl p-8 shadow-2xl relative flex flex-col">
                <div className="h-100 w-full mt-4">
                    {economyLoading ? (
                        <div className="h-full flex items-center justify-center text-primary"><Loader2 className="animate-spin" size={40} /></div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={economyData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" opacity={0.3} />
                                <XAxis dataKey="label" stroke="#868993" tick={{fill: '#868993', fontSize: 10, fontWeight: 600}} axisLine={false} tickLine={false} dy={20} minTickGap={30} padding={{ left: 35, right: 35 }} />
                                <YAxis orientation="right" stroke="#868993" tick={{fill: '#868993', fontSize: 11}} axisLine={false} tickLine={false} tickFormatter={(val) => economyMetric === 'population' ? `${val.toFixed(0)}M` : `%${val.toFixed(0)}`} />
                                <RechartsTooltip content={<CustomEconomyTooltip economyMetric={economyMetric} />} cursor={{ stroke: '#2a2e39', strokeWidth: 2 }} />
                                <Line type="monotone" dataKey="value" stroke={economyMetric === 'unemploymentRate' ? '#f23645' : '#089981'} strokeWidth={3} dot={{ r: 4, fill: economyMetric === 'unemploymentRate' ? '#f23645' : '#089981', strokeWidth: 0 }} activeDot={{ r: 7, fill: '#fff', stroke: '#089981', strokeWidth: 3 }} animationDuration={800} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                    <div className="flex items-center gap-1 bg-bg p-1.5 rounded-xl border border-border">
                        {ranges.map((r) => {
                            const isActive = economyRange === r.value;
                            return (
                                <button key={r.value} onClick={() => setEconomyRange(r.value)} className={`px-5 py-2 text-[11px] font-bold rounded-lg transition-all ${isActive ? 'bg-primary text-text shadow-lg' : 'text-text-muted hover:text-text hover:bg-surface-2'}`}>{t(`common:ranges.${r.key}`)}</button>
                            );
                        })}
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[11px] text-text-muted font-bold uppercase tracking-widest">{t('markets:live.dataSource')}</span>
                        <span className="text-[11px] text-primary font-bold tracking-wide">TCMB EVDS</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
