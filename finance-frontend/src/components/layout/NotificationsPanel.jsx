import { useEffect } from 'react';
import { X, CheckCheck, Trash2, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotifications, notificationTypeMeta } from '../../context/NotificationContext';
import { formatDateTime } from '../../utils/formatters/dateFormatter';

/**
 * "Hesabım → Bildirimler" paneli — sistem bildirimleri (grafik kaydetme, portföy
 * işlemleri, asistan hataları vb.) listesi. Fiyat alarmları ayrı bir route'ta (/alarms).
 */
export default function NotificationsPanel({ open, onClose }) {
    const { t } = useTranslation(['navbar', 'common']);
    const { notifications, markAllRead, removeNotification, clearNotifications } = useNotifications();

    // Panel açılınca okunmamışları okundu işaretle
    useEffect(() => {
        if (open) markAllRead();
    }, [open, markAllRead]);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-105 flex items-start justify-center sm:items-center bg-black/70 backdrop-blur-md p-4">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
                {/* Başlık */}
                <div className="border-b border-border">
                    <div className="flex items-center justify-between px-5 py-4">
                        <h3 className="text-lg font-bold text-text">{t('navbar:notifications.title', 'Bildirimler')}</h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors -mr-1"
                            aria-label={t('common:actions.cancel', 'Kapat')}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* İçerik */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <EmptyState
                            icon={Inbox}
                            title={t('navbar:notifications.empty', 'Henüz bildirim yok')}
                            sub={t('navbar:notifications.emptySub', 'Grafik kaydetme, portföy işlemleri ve diğer olaylar burada görünür.')}
                        />
                    ) : (
                        <ul className="divide-y divide-border">
                            {notifications.map((n) => (
                                <NotificationRow key={n.id} item={n} onRemove={() => removeNotification(n.id)} />
                            ))}
                        </ul>
                    )}
                </div>

                {/* Alt aksiyonlar */}
                {notifications.length > 0 && (
                    <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border bg-surface-2/40">
                        <button
                            onClick={markAllRead}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-text px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors"
                        >
                            <CheckCheck size={14} /> {t('navbar:notifications.markAllRead', 'Tümünü okundu yap')}
                        </button>
                        <button
                            onClick={clearNotifications}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sell hover:bg-sell/10 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Trash2 size={14} /> {t('navbar:notifications.clearAll', 'Tümünü temizle')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function NotificationRow({ item, onRemove }) {
    const meta = notificationTypeMeta(item.type);
    const Icon = meta.icon;
    return (
        <li className={`group flex items-start gap-3 px-4 py-3.5 hover:bg-surface-2/50 transition-colors ${item.read ? '' : 'bg-primary/4'}`}>
            <div className={`mt-0.5 w-9 h-9 shrink-0 rounded-lg ${meta.soft} ${meta.accent} flex items-center justify-center`}>
                <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {!item.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    <p className="text-sm font-bold text-text leading-snug truncate">{item.title}</p>
                </div>
                {item.message && <p className="text-xs text-text-muted mt-0.5 leading-snug">{item.message}</p>}
                <p className="text-[10px] text-text-muted/70 font-medium mt-1">{formatDateTime(item.ts)}</p>
            </div>
            <button
                onClick={onRemove}
                className="shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-sell hover:bg-sell/10 transition-all"
                aria-label="Sil"
            >
                <X size={14} />
            </button>
        </li>
    );
}

function EmptyState({ icon: Icon, title, sub }) {
    return (
        <div className="py-16 px-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-text-muted mb-4">
                <Icon size={26} />
            </div>
            <p className="text-sm font-bold text-text">{title}</p>
            <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto leading-relaxed">{sub}</p>
        </div>
    );
}
