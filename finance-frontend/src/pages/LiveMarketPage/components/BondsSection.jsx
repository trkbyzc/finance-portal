import React from 'react';
import { Landmark, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function BondsSection({ trBonds }) {
    return (
        <div className="mb-16">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                Türkiye Devlet Tahvili Getirileri <Landmark className="text-[#868993]" size={24} />
            </h2>
            <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl overflow-hidden shadow-lg p-6">
                <h3 className="text-sm font-bold text-[#868993] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <img src="https://flagcdn.com/w40/tr.png" alt="TR" className="w-5 h-5 rounded-full object-cover" /> Türkiye Getiri Eğrisi (EVDS)
                </h3>

                {trBonds && trBonds.length > 0 ? (
                    <>
                        <div className="h-[300px] w-full mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trBonds} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" />
                                    <XAxis dataKey="label" stroke="#868993" tick={{ fill: '#868993', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#868993" tick={{ fill: '#868993', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val.toFixed(1)}%`} domain={['dataMin - 1', 'dataMax + 1']} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e222d', borderColor: '#2a2e39', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#d1d4dc' }} formatter={(value) => `${value.toFixed(3)}%`} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                                    <Line type="monotone" dataKey="yield" name="Mevcut" stroke="#2962ff" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                <tr className="border-b border-[#2a2e39] text-[#868993] text-[12px] bg-[#0b0e14]">
                                    <th className="p-4 font-normal tracking-wide">Sembol</th>
                                    <th className="p-4 font-normal tracking-wide text-right">Getiri %</th>
                                    <th className="p-4 font-normal tracking-wide text-right">Vade Tarihi</th>
                                    <th className="p-4 font-normal tracking-wide text-right">Fiyat</th>
                                    <th className="p-4 font-normal tracking-wide text-right">Durum</th>
                                </tr>
                                </thead>
                                <tbody>
                                {trBonds.map((bond, i) => (
                                    <tr key={i} className="border-b border-[#2a2e39]/50 hover:bg-[#1e222d] transition-colors group text-[13px]">
                                        <td className="p-4 font-bold flex items-center gap-3">
                                            <span className="bg-[#1e222d] border border-[#2a2e39] px-2 py-1 rounded text-[#868993] text-[11px]">{bond.label}</span>
                                            <span className="text-[#d1d4dc]">{bond.name}</span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-[#d1d4dc]">{Number(bond.yield || 0).toFixed(3)}%</td>
                                        <td className="p-4 text-right text-[#868993]">{bond.maturityDate || '-'}</td>
                                        <td className="p-4 text-right text-[#d1d4dc]">100.000 <span className="text-[#868993] text-[10px]">PAR</span></td>
                                        <td className="p-4 text-right font-bold text-[#868993]">Güncel</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center p-10 text-[#868993]">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p>Tahvil verileri EVDS üzerinden toplanıyor...</p>
                    </div>
                )}
            </div>
        </div>
    );
}