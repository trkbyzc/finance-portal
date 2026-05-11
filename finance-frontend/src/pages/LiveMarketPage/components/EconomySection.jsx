import React from 'react';
import { ChevronRight, Loader2, TrendingUp, Users, UserPlus, Percent } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const CustomEconomyTooltip = ({ active, payload, label, economyMetric }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0b0e14] border border-[#2a2e39] p-3 rounded-xl shadow-2xl">
                <p className="text-[#868993] text-[10px] font-bold mb-1 uppercase tracking-wider">{label}</p>
                <p className="text-[#089981] text-lg font-mono font-black">
                    {Number(payload[0].value).toFixed(2)}<span className="text-[10px] ml-1">{economyMetric === 'population' ? 'M' : '%'}</span>
                </p>
            </div>
        );
    }
    return null;
};

// 🚀 ARTIK PROPLARIN İÇİNDE economyMacro DA VAR
export default function EconomySection({ economyMacro, economyMetric, setEconomyMetric, economyRange, setEconomyRange, economyData, economyLoading }) {

    // 🚀 DİNAMİK KARTLAR: Backend'den gelen veriyle besleniyor
    const dynamicEconomyMetrics = [
        { id: 'interestRate', label: 'Faiz Oranı', value: economyMacro?.interestRate ? `${economyMacro.interestRate}%` : '-%', icon: <Percent size={18} /> },
        { id: 'inflationRate', label: 'Enflasyon Oranı', value: economyMacro?.inflationRate ? `${economyMacro.inflationRate}%` : '-%', icon: <TrendingUp size={18} /> },
        { id: 'unemploymentRate', label: 'İşsizlik Oranı', value: economyMacro?.unemploymentRate ? `${economyMacro.unemploymentRate}%` : '-%', icon: <Users size={18} /> }
    ];

    return (
        <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                Türkiye Ekonomisi <ChevronRight className="text-[#868993]" size={24} />
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
                {dynamicEconomyMetrics.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setEconomyMetric(m.id)}
                        className={`p-6 rounded-2xl border transition-all duration-300 text-left group ${economyMetric === m.id ? 'bg-[#1e222d] border-[#2962ff] ring-1 ring-[#2962ff]' : 'bg-[#131722] border-[#2a2e39] hover:border-[#868993]'}`}
                    >
                        <div className="text-[10px] font-black text-[#868993] mb-1 uppercase tracking-[0.1em]">{m.label}</div>
                        <div className="text-2xl font-mono font-bold flex items-center justify-between text-[#d1d4dc]">
                            {m.value}
                            <div className={`p-2 rounded-lg transition-colors ${economyMetric === m.id ? 'bg-[#2962ff]/20 text-[#2962ff]' : 'bg-[#2a2e39] text-[#868993] group-hover:text-white'}`}>{m.icon}</div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="bg-[#131722] border border-[#2a2e39] rounded-3xl p-8 shadow-2xl relative flex flex-col">
                <div className="h-[400px] w-full mt-4">
                    {economyLoading ? (
                        <div className="h-full flex items-center justify-center text-[#2962ff]"><Loader2 className="animate-spin" size={40} /></div>
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

                <div className="mt-8 flex items-center justify-between border-t border-[#2a2e39] pt-6">
                    <div className="flex items-center gap-1 bg-[#0b0e14] p-1.5 rounded-xl border border-[#2a2e39]">
                        {['1Y', '5Y', '10Y', 'Tümü'].map((label) => {
                            const val = label.toLowerCase();
                            const isActive = (economyRange === val || (val === 'tümü' && economyRange === 'all'));
                            return (
                                <button key={label} onClick={() => setEconomyRange(val === 'tümü' ? 'all' : val)} className={`px-5 py-2 text-[11px] font-bold rounded-lg transition-all ${isActive ? 'bg-[#2962ff] text-white shadow-lg' : 'text-[#787b86] hover:text-white hover:bg-[#1e222d]'}`}>{label}</button>
                            );
                        })}
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[11px] text-[#5d606b] font-bold uppercase tracking-widest">Veri Kaynağı</span>
                        {/* 🚀 SON DOKUNUŞ: TCMB EVDS İMZASI */}
                        <span className="text-[11px] text-[#2962ff] font-bold tracking-wide">TCMB EVDS</span>
                    </div>
                </div>
            </div>
        </div>
    );
}