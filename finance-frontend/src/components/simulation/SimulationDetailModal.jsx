import React from 'react';
import { X, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const fmtTry = (v) => Number(v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('tr-TR'); } catch { return iso; }
};

function Stat({ label, value, valueClass = '' }) {
    return (
        <div className="bg-bg border border-border rounded-lg p-3">
            <div className="text-xs text-text-muted mb-1">{label}</div>
            <div className={`font-mono font-bold text-lg ${valueClass}`}>{value}</div>
        </div>
    );
}

/**
 * Simülasyon detay modal'ı — sermaye, anlık değer, K/Z, getiri % + recharts line grafiği.
 * SimulationPage'ten extract edildi; tek sorumluluk = bir sim için detaylı görünüm.
 */
export default function SimulationDetailModal({ sim, onClose, t }) {
    const r = sim.result || {};
    const chartData = (r.series || []).map(p => ({ date: p.date, value: Number(p.value) }));
    const positive = Number(r.pnlTry ?? 0) >= 0;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-3 right-3 text-text-muted hover:text-text z-10">
                    <X size={20} />
                </button>

                <div className="p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl md:text-2xl font-bold uppercase">{sim.symbol}</h2>
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-hover text-text-muted">
                            {t('common:assetTypes.' + sim.assetType, sim.assetType)}
                        </span>
                    </div>
                    <p className="text-text-muted text-sm mb-5">
                        {t('simulation:card.investedOn', { date: fmtDate(sim.investmentDate) })} · {fmtTry(sim.amountTry)} ₺
                    </p>

                    {r.effectiveStartDate && r.effectiveStartDate !== sim.investmentDate && (
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-4 flex items-start gap-2 text-primary text-sm">
                            <Info size={14} className="mt-0.5 shrink-0" />
                            <span>{t('simulation:result.effectiveStartDate', { date: fmtDate(r.effectiveStartDate) })}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <Stat label={t('simulation:result.invested')} value={`${fmtTry(sim.amountTry)} ₺`} />
                        <Stat label={t('simulation:result.currentValue')} value={`${fmtTry(r.currentValue)} ₺`} />
                        <Stat
                            label={t('simulation:result.pnl')}
                            value={`${positive ? '+' : ''}${fmtTry(r.pnlTry)} ₺`}
                            valueClass={positive ? 'text-buy' : 'text-sell'}
                        />
                        <Stat
                            label={t('simulation:result.pnlPct')}
                            value={`${positive ? '+' : ''}${Number(r.pnlPct ?? 0).toFixed(2)}%`}
                            valueClass={positive ? 'text-buy' : 'text-sell'}
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-6">
                        <Stat label={t('simulation:result.units')} value={Number(r.unitsBought ?? 0).toFixed(6)} />
                        <Stat label={t('simulation:result.entryPrice')} value={`${fmtTry(r.entryPrice)} ₺`} />
                    </div>

                    <div className="bg-bg border border-border rounded-lg p-4">
                        <h3 className="font-semibold mb-3">{t('simulation:chart.title')}</h3>
                        <div style={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer>
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="date" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                                    <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                                        labelStyle={{ color: 'var(--color-text-muted)' }}
                                        formatter={(v) => [`${fmtTry(v)} ₺`, t('simulation:chart.axisValue')]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke={positive ? 'var(--color-buy)' : 'var(--color-sell)'}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {sim.notes && (
                        <div className="mt-4 bg-bg border border-border rounded-lg p-3 text-sm text-text-muted italic">
                            {sim.notes}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
