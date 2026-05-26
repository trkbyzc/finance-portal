import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LineChart as LineChartIcon, Plus, Trash2, Loader2, X, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { simulationApi } from '../../services/api/simulationApi';
import CreateSimulationModal from '../../components/simulation/CreateSimulationModal';

const fmtTry = (v) => Number(v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('tr-TR'); } catch { return iso; }
};

export default function SimulationPage() {
    const { t } = useTranslation(['simulation', 'common']);
    const queryClient = useQueryClient();

    const [createOpen, setCreateOpen] = useState(false);
    const [detailSim, setDetailSim] = useState(null);

    const { data: sims = [], isLoading, isError } = useQuery({
        queryKey: ['simulations'],
        queryFn: simulationApi.getMySimulations
    });

    const createMutation = useMutation({
        mutationFn: simulationApi.createSimulation,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simulations'] })
    });

    const deleteMutation = useMutation({
        mutationFn: simulationApi.deleteSimulation,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simulations'] })
    });

    const handlePreview = (body) => simulationApi.previewSimulation(body);
    const handleSave = (body) => createMutation.mutateAsync(body);

    const handleDelete = (sim) => {
        if (!window.confirm(t('simulation:actions.removeConfirm', { symbol: sim.symbol }))) return;
        deleteMutation.mutate(sim.id);
    };

    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                            <LineChartIcon size={20} />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold">{t('simulation:pageTitle')}</h1>
                    </div>
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-fg rounded-lg font-semibold transition"
                    >
                        <Plus size={18} /> {t('simulation:actions.new')}
                    </button>
                </div>
                <p className="text-text-muted mb-8">{t('simulation:pageSubtitle')}</p>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin mr-3" size={24} />
                        <span>{t('common:status.loading')}</span>
                    </div>
                ) : isError ? (
                    <div className="bg-sell/10 border border-sell/30 rounded-xl p-6 text-sell">
                        {t('simulation:toast.error')}
                    </div>
                ) : sims.length === 0 ? (
                    <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-4 flex items-center justify-center text-primary">
                            <LineChartIcon size={28} />
                        </div>
                        <h2 className="text-xl font-bold mb-2">{t('simulation:empty.title')}</h2>
                        <p className="text-text-muted mb-6 max-w-md mx-auto">{t('simulation:empty.subtitle')}</p>
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-fg rounded-lg font-semibold transition"
                        >
                            <Plus size={18} /> {t('simulation:empty.cta')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {sims.map(sim => (
                            <SimCard
                                key={sim.id}
                                sim={sim}
                                onDetail={() => setDetailSim(sim)}
                                onDelete={() => handleDelete(sim)}
                                t={t}
                            />
                        ))}
                    </div>
                )}

                <CreateSimulationModal
                    isOpen={createOpen}
                    onClose={() => setCreateOpen(false)}
                    onPreview={handlePreview}
                    onSave={handleSave}
                />

                {detailSim && (
                    <DetailModal
                        sim={detailSim}
                        onClose={() => setDetailSim(null)}
                        t={t}
                    />
                )}
            </div>
        </div>
    );
}

function SimCard({ sim, onDetail, onDelete, t }) {
    const r = sim.result || {};
    const hasResult = !r.warning && r.series && r.series.length > 0;
    const pnlPct = Number(r.pnlPct ?? 0);
    const pnlTry = Number(r.pnlTry ?? 0);
    const positive = pnlTry >= 0;

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 hover:border-border-strong transition">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="font-bold text-lg uppercase">{sim.symbol}</div>
                    <div className="text-xs text-text-muted">{sim.assetType}</div>
                </div>
                <button
                    onClick={onDelete}
                    className="text-text-muted hover:text-sell p-1 rounded transition"
                    title={t('simulation:actions.delete')}
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="text-xs text-text-muted mb-3">
                {t('simulation:card.investedOn', { date: fmtDate(sim.investmentDate) })} · {fmtTry(sim.amountTry)} ₺
            </div>

            {hasResult ? (
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-xs text-text-muted">{t('simulation:result.currentValue')}</div>
                        <div className="font-mono font-bold text-lg">{fmtTry(r.currentValue)} ₺</div>
                    </div>
                    <div className={`text-right inline-flex items-center gap-1 font-mono font-bold ${positive ? 'text-buy' : 'text-sell'}`}>
                        {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <div>
                            <div className="text-sm">{positive ? '+' : ''}{pnlPct.toFixed(2)}%</div>
                            <div className="text-[10px] opacity-80">{positive ? '+' : ''}{fmtTry(pnlTry)} ₺</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-3 flex items-start gap-2 text-warning text-xs">
                    <Info size={14} className="mt-0.5 shrink-0" />
                    <span>{r.warning || t('simulation:result.noResult')}</span>
                </div>
            )}

            {sim.notes && (
                <p className="text-xs text-text-muted italic line-clamp-2 mb-3">{sim.notes}</p>
            )}

            <button
                onClick={onDetail}
                disabled={!hasResult}
                className="w-full px-3 py-2 bg-bg hover:bg-surface-hover border border-border rounded-lg font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {t('simulation:actions.viewChart')}
            </button>
        </div>
    );
}

function DetailModal({ sim, onClose, t }) {
    const r = sim.result || {};
    const chartData = (r.series || []).map(p => ({ date: p.date, value: Number(p.value) }));
    const positive = Number(r.pnlTry ?? 0) >= 0;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-3 right-3 text-text-muted hover:text-text z-10">
                    <X size={20} />
                </button>

                <div className="p-6">
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-bold uppercase">{sim.symbol}</h2>
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-hover text-text-muted">{sim.assetType}</span>
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

function Stat({ label, value, valueClass = '' }) {
    return (
        <div className="bg-bg border border-border rounded-lg p-3">
            <div className="text-xs text-text-muted mb-1">{label}</div>
            <div className={`font-mono font-bold text-lg ${valueClass}`}>{value}</div>
        </div>
    );
}
