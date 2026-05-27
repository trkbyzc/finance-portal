import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Star, Plus, Trash2, Loader2 } from 'lucide-react';

import { watchlistApi } from '../../services/api/watchlistApi';
import BaseAssetPickerModal from '../../components/common/BaseAssetPickerModal';

function Sparkline({ data, positive }) {
    if (!data || data.length < 2) {
        return <div className="text-text-muted text-xs">—</div>;
    }
    const nums = data.map(v => parseFloat(v) || 0);
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const range = max - min || 1;
    const width = 96;
    const height = 28;
    const step = width / (nums.length - 1);
    const points = nums.map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
    const color = positive ? 'var(--color-buy)' : 'var(--color-sell)';
    return (
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
}

export default function WatchlistPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useTranslation(['watchlist', 'common']);
    const [modalOpen, setModalOpen] = useState(false);

    const { data: items = [], isLoading, isError } = useQuery({
        queryKey: ['watchlist'],
        queryFn: watchlistApi.getMyWatchlist
    });

    const addMutation = useMutation({
        mutationFn: watchlistApi.addToWatchlist,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    });

    const removeMutation = useMutation({
        mutationFn: watchlistApi.removeFromWatchlist,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    });

    const handleAdd = async (req) => {
        await addMutation.mutateAsync(req);
    };

    const handleRemove = (itemId, symbol) => {
        if (!window.confirm(t('watchlist:actions.removeConfirm', { symbol }))) return;
        removeMutation.mutate(itemId);
    };

    const handleRowClick = (item) => {
        const params = item.assetType ? `?cat=${item.assetType}` : '';
        navigate(`/chart/${encodeURIComponent(item.symbol)}${params}`);
    };

    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                            <Star size={20} />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold">{t('watchlist:pageTitle')}</h1>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-fg rounded-lg font-semibold transition"
                    >
                        <Plus size={18} /> {t('watchlist:actions.add')}
                    </button>
                </div>
                <p className="text-text-muted mb-8">{t('watchlist:pageSubtitle')}</p>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin mr-3" size={24} />
                        <span>{t('common:status.loading')}</span>
                    </div>
                ) : isError ? (
                    <div className="bg-sell/10 border border-sell/30 rounded-xl p-6 text-sell">
                        {t('watchlist:toast.error')}
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-4 flex items-center justify-center text-primary">
                            <Star size={28} />
                        </div>
                        <h2 className="text-xl font-bold mb-2">{t('watchlist:empty.title')}</h2>
                        <p className="text-text-muted mb-6 max-w-md mx-auto">{t('watchlist:empty.subtitle')}</p>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-fg rounded-lg font-semibold transition"
                        >
                            <Plus size={18} /> {t('watchlist:empty.cta')}
                        </button>
                    </div>
                ) : (
                    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                <tr className="border-b border-border text-text-muted text-[13px] bg-bg">
                                    <th className="p-4 font-normal">{t('watchlist:cols.asset')}</th>
                                    <th className="p-4 font-normal text-right">{t('watchlist:cols.price')}</th>
                                    <th className="p-4 font-normal text-right">{t('watchlist:cols.dailyChange')}</th>
                                    <th className="p-4 font-normal text-center">{t('watchlist:cols.trend')}</th>
                                    <th className="p-4 font-normal text-right">{t('watchlist:cols.actions')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {items.map(item => {
                                    const change = parseFloat(item.dailyChangePct) || 0;
                                    const positive = change >= 0;
                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => handleRowClick(item)}
                                            className="border-b border-border/50 hover:bg-surface-hover transition cursor-pointer group"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-surface-2 text-text-muted flex items-center justify-center font-bold text-sm group-hover:bg-primary group-hover:text-primary-fg transition">
                                                        {(item.symbol || '').substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold uppercase">{item.symbol}</div>
                                                        <div className="text-xs text-text-muted">{t('common:assetTypes.' + item.assetType, item.assetType)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold">
                                                {parseFloat(item.currentPrice || 0).toFixed(2)} ₺
                                            </td>
                                            <td className={`p-4 text-right font-mono font-bold text-sm ${positive ? 'text-buy' : 'text-sell'}`}>
                                                {positive ? '+' : ''}{change.toFixed(2)}%
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center">
                                                    <Sparkline data={item.sparkline} positive={positive} />
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemove(item.id, item.symbol); }}
                                                    disabled={removeMutation.isPending}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-sell hover:bg-sell/10 transition disabled:opacity-50"
                                                    aria-label={t('watchlist:actions.remove')}
                                                    title={t('watchlist:actions.remove')}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <BaseAssetPickerModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    titleKey="watchlist:modal.addTitle"
                    excludeKeys={items.map(it => `${it.assetType}:${it.symbol}`)}
                    onSelect={async ({ symbol, assetType }) => {
                        try {
                            await handleAdd({ symbol, assetType });
                            setModalOpen(false);
                        } catch (e) {
                            // eslint-disable-next-line no-console
                            console.error('Watchlist add error', e);
                        }
                    }}
                />
            </div>
        </div>
    );
}
