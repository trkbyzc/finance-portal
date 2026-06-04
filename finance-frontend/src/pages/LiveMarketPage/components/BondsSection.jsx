import React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { translateBondLabel, translateBondName, translateBondDate } from '../../../utils/bondLabelTranslator';

export default function BondsSection({ trBonds }) {
    const { t } = useTranslation(['markets', 'common']);
    return (
        <div className="mb-16">
            <h2 className="text-2xl font-bold text-text flex items-center gap-2 mb-6">
                {t('markets:live.bonds')} <ChevronRight className="text-text-muted" size={24} />
            </h2>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-lg p-6">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                    <img src="https://flagcdn.com/w40/tr.png" alt="TR" className="w-5 h-5 rounded-full object-cover" /> {t('markets:live.yieldCurveTr')}
                </h3>

                {trBonds && trBonds.length > 0 ? (
                    <>
                        <div className="h-[300px] w-full mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trBonds.map(b => ({ ...b, label: translateBondLabel(b.label) }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" />
                                    <XAxis dataKey="label" stroke="#868993" tick={{ fill: '#868993', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#868993" tick={{ fill: '#868993', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val.toFixed(1)}%`} domain={['dataMin - 1', 'dataMax + 1']} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e222d', borderColor: '#2a2e39', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#d1d4dc' }} formatter={(value) => `${value.toFixed(3)}%`} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                                    <Line type="monotone" dataKey="yield" name={t('markets:live.currentYield')} stroke="#2962ff" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                <tr className="border-b border-border text-text-muted text-[12px] bg-bg">
                                    <th className="p-4 font-normal tracking-wide">{t('common:labels.symbol')}</th>
                                    <th className="p-4 font-normal tracking-wide text-right">{t('markets:live.yieldPct')}</th>
                                    <th className="p-4 font-normal tracking-wide text-right">{t('markets:live.maturityDate')}</th>
                                    <th className="p-4 font-normal tracking-wide text-right">{t('common:labels.price')}</th>
                                    <th className="p-4 font-normal tracking-wide text-right">{t('common:labels.status')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {trBonds.map((bond, i) => (
                                    <tr key={i} className="border-b border-border/50 hover:bg-surface-2 transition-colors group text-[13px]">
                                        <td className="p-4 font-bold flex items-center gap-3">
                                            <span className="bg-surface-2 border border-border px-2 py-1 rounded text-text-muted text-[11px]">{translateBondLabel(bond.label)}</span>
                                            <span className="text-text">{translateBondName(bond.name)}</span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-text">{Number(bond.yield || 0).toFixed(3)}%</td>
                                        <td className="p-4 text-right text-text-muted">{bond.maturityDate ? translateBondDate(bond.maturityDate) : '-'}</td>
                                        <td className="p-4 text-right text-text">100.000 <span className="text-text-muted text-[10px]">PAR</span></td>
                                        <td className="p-4 text-right font-bold text-text-muted">{t('common:status.live')}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center p-10 text-text-muted">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p>{t('markets:live.loadingBonds')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
