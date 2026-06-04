import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell, Loader2, Trash2, ArrowUp, ArrowDown, Power, Zap, Repeat } from 'lucide-react';
import { alarmApi } from '../../services/api/alarmApi';
import { useNotify } from '../../context/NotificationContext';

export default function AlarmsPage() {
    const { t, i18n } = useTranslation(['alarm', 'common']);
    const lang = i18n.language?.startsWith('en') ? 'en-GB' : 'tr-TR';
    const queryClient = useQueryClient();
    const notify = useNotify();

    const { data: alarms = [], isLoading } = useQuery({
        queryKey: ['my-alarms'],
        queryFn: alarmApi.listMine
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, active }) => alarmApi.setActive(id, active),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-alarms'] })
    });

    const deleteMutation = useMutation({
        mutationFn: alarmApi.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-alarms'] });
            notify({ type: 'warning', title: t('alarm:list.deleted', 'Alarm silindi') });
        }
    });

    const fmtDate = (s) => s ? new Date(s).toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
    const fmtNumber = (v) => Number(v ?? 0).toLocaleString(lang, { maximumFractionDigits: 8 });

    return (
        <div className="min-h-screen bg-bg p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                        <Bell size={20} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                        {t('alarm:list.title', 'Fiyat Alarmlarım')}
                    </h1>
                </header>
                <p className="text-text-muted mb-6 text-sm sm:text-base">
                    {t('alarm:list.subtitle', 'Aktif alarmlarınız, son tetiklenme bilgisi ve durum kontrolü.')}
                </p>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin mr-3" size={24} />
                        <span>{t('common:status.loading')}</span>
                    </div>
                ) : alarms.length === 0 ? (
                    <div className="bg-surface-2 border border-border rounded-2xl p-10 text-center">
                        <Bell size={32} className="mx-auto mb-3 opacity-40" />
                        <p className="text-text-muted text-sm">{t('alarm:list.empty', 'Henüz alarm kurmadın. Varlık detayında "Alarm Kur" butonunu kullanabilirsin.')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {alarms.map((a) => {
                            const isAbove = a.condition === 'ABOVE';
                            const isOnce = a.frequency === 'ONCE';
                            return (
                                <div
                                    key={a.id}
                                    className={`bg-surface-2 border rounded-2xl p-4 md:p-5 transition ${a.active ? 'border-border' : 'border-border opacity-60'}`}
                                >
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-base">{a.symbol}</span>
                                                <span className="text-[10px] uppercase tracking-wider text-text-muted px-2 py-0.5 bg-bg border border-border rounded">
                                                    {a.assetType}
                                                </span>
                                                {!a.active && (
                                                    <span className="text-[10px] uppercase tracking-wider text-text-muted px-2 py-0.5 bg-bg border border-border rounded">
                                                        {t('alarm:list.inactive', 'pasif')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-text">
                                                {isAbove
                                                    ? <ArrowUp size={14} className="text-buy" />
                                                    : <ArrowDown size={14} className="text-sell" />}
                                                <span className={isAbove ? 'text-buy' : 'text-sell'}>
                                                    {isAbove ? t('alarm:modal.above', 'Üzerine Çıkarsa') : t('alarm:modal.below', 'Altına İnerse')}
                                                </span>
                                                <span className="font-mono font-bold">{fmtNumber(a.threshold)}</span>
                                                <span className="text-text-muted">·</span>
                                                {isOnce
                                                    ? <Zap size={12} className="text-warning" />
                                                    : <Repeat size={12} className="text-primary" />}
                                                <span className="text-text-muted text-xs">
                                                    {isOnce ? t('alarm:modal.once', 'Tek Seferlik') : t('alarm:modal.continuous', 'Sürekli')}
                                                </span>
                                            </div>
                                            {a.note && (
                                                <p className="text-xs text-text-muted italic mt-2 line-clamp-2">"{a.note}"</p>
                                            )}
                                            <div className="flex items-center gap-3 text-[11px] text-text-muted mt-2">
                                                <span>{t('alarm:list.createdAt', 'Oluşturma')}: {fmtDate(a.createdAt)}</span>
                                                {a.triggerCount > 0 && (
                                                    <span>· {t('alarm:list.triggered', 'Tetiklenme')}: {a.triggerCount}× ({fmtDate(a.lastTriggeredAt)})</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => toggleMutation.mutate({ id: a.id, active: !a.active })}
                                                disabled={toggleMutation.isPending}
                                                className={`p-2 rounded-lg border transition ${
                                                    a.active
                                                        ? 'border-border text-text-muted hover:text-warning hover:border-warning/50 hover:bg-warning/5'
                                                        : 'border-buy/30 text-buy hover:bg-buy/10'
                                                }`}
                                                title={a.active ? t('alarm:list.deactivate', 'Pasife al') : t('alarm:list.activate', 'Etkinleştir')}
                                            >
                                                <Power size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteMutation.mutate(a.id)}
                                                disabled={deleteMutation.isPending}
                                                className="p-2 rounded-lg border border-border text-text-muted hover:text-sell hover:border-sell/50 hover:bg-sell/5 transition"
                                                title={t('common:actions.delete', 'Sil')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
