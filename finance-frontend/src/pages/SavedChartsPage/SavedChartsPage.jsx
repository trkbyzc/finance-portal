import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CandlestickChart, Trash2, Pencil, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { savedChartApi } from '../../services/api/savedChartApi';
import PromptModal from '../../components/layout/PromptModal';
import Modal from '../../components/layout/Modal';
import { useNotify } from '../../context/NotificationContext';

/**
 * "Hesabım" — Kullanıcının çizim araçlarıyla kaydettiği grafiklerin listesi.
 * Kart'a tıklayınca grafik açılıp çizimler geri yüklenir (?saved=id).
 */
export default function SavedChartsPage() {
    const { t, i18n } = useTranslation(['charts', 'common']);
    const navigate = useNavigate();
    const qc = useQueryClient();
    const notify = useNotify();
    const [renameTarget, setRenameTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data: charts = [], isLoading } = useQuery({
        queryKey: ['savedCharts'],
        queryFn: savedChartApi.getMyCharts,
    });

    const renameMut = useMutation({
        mutationFn: ({ id, name }) => savedChartApi.updateChart(id, { name }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['savedCharts'] }),
    });
    const deleteMut = useMutation({
        mutationFn: (id) => savedChartApi.deleteChart(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['savedCharts'] });
            notify({ type: 'warning', title: t('charts:saved.deletedToast', 'Grafik silindi') });
        },
    });

    const open = (c) => {
        const cat = c.assetCategory ? `&cat=${encodeURIComponent(c.assetCategory)}` : '';
        navigate(`/chart/${encodeURIComponent(c.symbol)}?saved=${c.id}${cat}`);
    };
    const submitRename = (name) => {
        if (renameTarget && name !== renameTarget.name) renameMut.mutate({ id: renameTarget.id, name });
        setRenameTarget(null);
    };
    const confirmDelete = () => {
        if (deleteTarget) deleteMut.mutate(deleteTarget.id);
        setDeleteTarget(null);
    };

    const fmtDate = (d) => {
        if (!d) return '';
        const iso = Array.isArray(d) ? `${d[0]}-${String(d[1]).padStart(2, '0')}-${String(d[2]).padStart(2, '0')}` : d;
        try { return new Date(iso).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return iso; }
    };

    return (
        <div className="bg-bg text-text min-h-screen">
            <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <CandlestickChart size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{t('charts:saved.title', 'Kayıtlı Grafiklerim')}</h1>
                        <p className="text-sm text-text-muted">{t('charts:saved.subtitle', 'Çizimlerini kaydettiğin grafikler. Açmak için karta tıkla.')}</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24 text-text-muted">
                        <Loader2 className="animate-spin" size={28} />
                    </div>
                ) : charts.length === 0 ? (
                    <div className="text-center py-20 bg-surface border border-border rounded-2xl">
                        <CandlestickChart size={40} className="mx-auto text-text-muted/50 mb-3" />
                        <p className="font-semibold mb-1">{t('charts:saved.emptyTitle', 'Henüz kayıtlı grafik yok')}</p>
                        <p className="text-sm text-text-muted">{t('charts:saved.emptyDesc', 'Bir grafikte çizim yapıp soldaki kaydet (💾) butonuna bas.')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {charts.map((c) => (
                            <div
                                key={c.id}
                                className="group bg-surface border border-border rounded-2xl p-4 hover:border-primary/40 transition cursor-pointer flex flex-col"
                                onClick={() => open(c)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="font-bold text-text truncate">{c.name}</div>
                                        <div className="text-xs text-text-muted font-mono mt-0.5 uppercase">
                                            {c.symbol}{c.assetCategory ? ` · ${t('common:assetTypes.' + c.assetCategory, c.assetCategory)}` : ''}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setRenameTarget(c); }}
                                            className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10"
                                            title={t('charts:saved.rename', 'Yeniden adlandır')}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                                            className="p-1.5 rounded-md text-text-muted hover:text-sell hover:bg-sell/10"
                                            title={t('charts:saved.delete', 'Sil')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                                    <span className="text-[11px] text-text-muted">{fmtDate(c.createdAt)}</span>
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                        {t('charts:saved.open', 'Aç')} <ArrowRight size={13} />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <PromptModal
                open={!!renameTarget}
                title={t('charts:saved.rename', 'Yeniden adlandır')}
                label={t('charts:saved.renamePrompt', 'Yeni ad:')}
                defaultValue={renameTarget?.name || ''}
                confirmText={t('common:actions.save')}
                onSubmit={submitRename}
                onCancel={() => setRenameTarget(null)}
            />

            <Modal
                isOpen={!!deleteTarget}
                type="error"
                title={t('charts:saved.delete', 'Sil')}
                message={t('charts:saved.deleteConfirm', '"{{name}}" grafiği silinsin mi?', { name: deleteTarget?.name })}
                confirmText={t('common:actions.delete', 'Sil')}
                showCancel
                onCancel={() => setDeleteTarget(null)}
                onClose={confirmDelete}
            />
        </div>
    );
}
