import React, { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { GitCompare, Plus, X, Loader2, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

import { whatIfApi } from '../../services/api/whatIfApi';
import BaseAssetPickerModal from '../../components/common/BaseAssetPickerModal';

// Recharts multi-line için sabit palet — 8 farklı renk, asset chip ve line aynı renkte.
const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const fmtTry = (v) => Number(v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function WhatIfPage() {
    const { t } = useTranslation(['whatIf', 'common', 'simulation']);

    const [investmentDate, setInvestmentDate] = useState('');
    const [amountTry, setAmountTry] = useState('');
    const [assets, setAssets] = useState([]); // [{symbol, assetType, label}]
    const [pickerOpen, setPickerOpen] = useState(false);
    const [result, setResult] = useState(null);

    const compareMutation = useMutation({
        mutationFn: whatIfApi.compare,
        onSuccess: (data) => setResult(data),
        onError: () => setResult(null)
    });

    const handleAddAsset = (asset) => {
        const key = `${asset.assetType}:${asset.symbol}`;
        if (assets.find(a => `${a.assetType}:${a.symbol}` === key)) return;
        setAssets([...assets, asset]);
        setPickerOpen(false);
        setResult(null); // form değişti, eski result invalidate
    };

    const handleRemoveAsset = (idx) => {
        setAssets(assets.filter((_, i) => i !== idx));
        setResult(null);
    };

    const handleCompare = () => {
        if (!investmentDate || !amountTry || assets.length === 0) return;
        const payload = {
            investmentDate,
            amountTry: parseFloat(amountTry),
            assets: assets.map(a => ({ symbol: a.symbol, assetType: a.assetType }))
        };
        compareMutation.mutate(payload);
    };

    /**
     * Chart için merge: tüm asset series'leri tek tablo'da topla.
     * Backend her asset için kendi tarih listesini dönebilir (downsample sonrası tarih setleri ayrışır);
     * burada Map ile birleştirip null'lar için connectNulls=true.
     */
    const chartData = useMemo(() => {
        if (!result || !result.assets || result.assets.length === 0) return [];
        const dateMap = new Map();
        result.assets.forEach((a) => {
            (a.series || []).forEach(p => {
                if (!dateMap.has(p.date)) dateMap.set(p.date, { date: p.date });
                dateMap.get(p.date)[a.key] = Number(p.value);
            });
        });
        return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [result]);

    const canCompare = investmentDate && amountTry && parseFloat(amountTry) > 0 && assets.length >= 1 && !compareMutation.isPending;

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                        <GitCompare size={20} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">{t('whatIf:pageTitle')}</h1>
                </div>
                <p className="text-text-muted mb-8">{t('whatIf:pageSubtitle')}</p>

                {/* Form */}
                <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase">
                                {t('whatIf:form.investmentDate')}
                            </label>
                            <input
                                type="date"
                                value={investmentDate}
                                onChange={(e) => { setInvestmentDate(e.target.value); setResult(null); }}
                                max={todayStr}
                                className="w-full bg-bg border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase">
                                {t('whatIf:form.amount')} (TRY)
                            </label>
                            <input
                                type="number"
                                value={amountTry}
                                onChange={(e) => { setAmountTry(e.target.value); setResult(null); }}
                                placeholder="10000"
                                min="0"
                                step="100"
                                className="w-full bg-bg border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleCompare}
                                disabled={!canCompare}
                                className="w-full px-4 py-2 bg-primary hover:bg-primary-hover text-primary-fg rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            >
                                {compareMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <GitCompare size={16} />}
                                {t('whatIf:form.compare')}
                            </button>
                        </div>
                    </div>

                    {/* Asset chips */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 uppercase">
                            {t('whatIf:form.assets')} ({assets.length})
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                            {assets.map((a, idx) => (
                                <div
                                    key={`${a.assetType}:${a.symbol}`}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg border rounded-lg text-sm"
                                    style={{ borderColor: PALETTE[idx % PALETTE.length] + '60' }}
                                >
                                    <span className="w-2 h-2 rounded-full" style={{ background: PALETTE[idx % PALETTE.length] }}></span>
                                    <span className="font-bold">{a.symbol}</span>
                                    <span className="text-xs text-text-muted">{t('common:assetTypes.' + a.assetType, a.assetType)}</span>
                                    <button onClick={() => handleRemoveAsset(idx)} className="text-text-muted hover:text-sell ml-1">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setPickerOpen(true)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-semibold transition"
                            >
                                <Plus size={14} /> {t('whatIf:form.addCompare')}
                            </button>
                        </div>
                        {assets.length === 0 && (
                            <p className="text-xs text-text-muted mt-2">{t('whatIf:form.assetsHint')}</p>
                        )}
                    </div>
                </div>

                {/* Results */}
                {compareMutation.isPending ? (
                    <div className="flex items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin mr-3" size={24} />
                        <span>{t('common:status.loading')}</span>
                    </div>
                ) : compareMutation.isError ? (
                    <div className="bg-sell/10 border border-sell/30 rounded-xl p-6 text-sell">
                        {t('whatIf:toast.error')}
                    </div>
                ) : !result ? (
                    <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-4 flex items-center justify-center text-primary">
                            <GitCompare size={28} />
                        </div>
                        <h2 className="text-xl font-bold mb-2">{t('whatIf:empty.title')}</h2>
                        <p className="text-text-muted max-w-md mx-auto">{t('whatIf:empty.subtitle')}</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
                            <h3 className="font-semibold mb-3">{t('whatIf:chart.title')}</h3>
                            <div style={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                        <XAxis dataKey="date" stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                                            labelStyle={{ color: 'var(--color-text-muted)' }}
                                            formatter={(v) => `${fmtTry(v)} ₺`}
                                        />
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

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {result.assets.map((a, idx) => {
                                const positive = Number(a.pnlTry ?? 0) >= 0;
                                return (
                                    <div key={a.key} className="bg-surface border border-border rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-3 h-3 rounded-full" style={{ background: PALETTE[idx % PALETTE.length] }}></span>
                                            <div className="font-bold uppercase">{a.symbol}</div>
                                            <span className="text-xs text-text-muted">{t('common:assetTypes.' + a.assetType, a.assetType)}</span>
                                        </div>
                                        {a.warning ? (
                                            <div className="bg-warning/10 border border-warning/30 rounded-lg p-2 text-warning text-xs flex items-start gap-2">
                                                <Info size={12} className="mt-0.5 shrink-0" />
                                                <span>{a.warning}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-text-muted">{t('whatIf:result.currentValue')}</span>
                                                    <span className="font-mono font-bold">{fmtTry(a.currentValue)} ₺</span>
                                                </div>
                                                <div className={`flex items-center justify-between mt-2 pt-2 border-t border-border ${positive ? 'text-buy' : 'text-sell'}`}>
                                                    <span className="text-xs font-semibold inline-flex items-center gap-1">
                                                        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                        {t('whatIf:result.pnlPct')}
                                                    </span>
                                                    <span className="font-mono font-bold">
                                                        {positive ? '+' : ''}{Number(a.pnlPct ?? 0).toFixed(2)}%
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-text-muted text-right mt-1">
                                                    {positive ? '+' : ''}{fmtTry(a.pnlTry)} ₺
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                <BaseAssetPickerModal
                    isOpen={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    titleKey="whatIf:modal.title"
                    excludeKeys={assets.map(a => `${a.assetType}:${a.symbol}`)}
                    onSelect={({ symbol, assetType, label }) => {
                        handleAddAsset({ symbol, assetType, label });
                        setPickerOpen(false);
                    }}
                />
            </div>
        </div>
    );
}
