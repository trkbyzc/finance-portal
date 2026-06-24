import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';

/**
 * Uygulama geneli bildirim & toast altyapısı.
 *
 * - notify(...) çağrısı hem sol-altta geçici bir "toast" gösterir hem de
 *   kalıcı bildirim geçmişine ekler (localStorage, kullanıcı bazlı).
 * - Geçmiş, "Hesabım → Bildirimler" panelinde listelenir.
 * - Native alert/confirm/prompt yerine sistem lacivertinde şık kutular kullanılır.
 */
const NotificationContext = createContext(null);

const MAX_HISTORY = 50;
const TOAST_TTL = 4200; // ms

const storageKey = (user) => `fp_notifications_${user?.username || user?.email || 'guest'}`;

const TYPE_META = {
    success: { icon: CheckCircle2, accent: 'text-buy', ring: 'border-l-buy', soft: 'bg-buy/10' },
    error:   { icon: XCircle,      accent: 'text-sell', ring: 'border-l-sell', soft: 'bg-sell/10' },
    warning: { icon: AlertTriangle, accent: 'text-warning', ring: 'border-l-warning', soft: 'bg-warning/10' },
    info:    { icon: Info,         accent: 'text-primary', ring: 'border-l-primary', soft: 'bg-primary/10' }
};
export const notificationTypeMeta = (type) => TYPE_META[type] || TYPE_META.info;

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);
    const timersRef = useRef(new Map());

    const nextId = () => {
        idRef.current += 1;
        return `${Date.now()}-${idRef.current}`;
    };

    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey(user));
            setNotifications(raw ? JSON.parse(raw) : []);
        } catch {
            setNotifications([]);
        }
    }, [user]);

    useEffect(() => {
        try {
            localStorage.setItem(storageKey(user), JSON.stringify(notifications));
        } catch { /* kota/erişim yoksa yoksay */ }
    }, [notifications, user]);

    useEffect(() => () => {
        timersRef.current.forEach((tid) => clearTimeout(tid));
        timersRef.current.clear();
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        const tid = timersRef.current.get(id);
        if (tid) { clearTimeout(tid); timersRef.current.delete(id); }
    }, []);

    /**
     * @param {Object} opts
     * @param {'success'|'error'|'warning'|'info'} [opts.type]
     * @param {string} opts.title
     * @param {string} [opts.message]
     * @param {boolean} [opts.toast=true]    - sol altta geçici toast göster
     * @param {boolean} [opts.persist=true]  - bildirim geçmişine kaydet
     */
    const notify = useCallback(({ type = 'info', title, message = '', toast = true, persist = true }) => {
        const id = nextId();
        const entry = { id, type, title, message, ts: Date.now(), read: false };

        if (persist) {
            setNotifications((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
        }
        if (toast) {
            setToasts((prev) => [...prev, entry]);
            const tid = setTimeout(() => removeToast(id), TOAST_TTL);
            timersRef.current.set(id, tid);
        }
        return id;
    }, [removeToast]);

    const markAllRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const clearNotifications = useCallback(() => setNotifications([]), []);

    const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

    const value = useMemo(() => ({
        notify, notifications, unreadCount, markAllRead, removeNotification, clearNotifications
    }), [notify, notifications, unreadCount, markAllRead, removeNotification, clearNotifications]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <ToastViewport toasts={toasts} onClose={removeToast} />
        </NotificationContext.Provider>
    );
}

function ToastViewport({ toasts, onClose }) {
    if (!toasts.length) return null;
    return (
        <div className="fixed bottom-4 left-4 z-200 flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))] pointer-events-none">
            {toasts.map((toast) => (
                <ToastCard key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
            ))}
        </div>
    );
}

function ToastCard({ toast, onClose }) {
    const { t } = useTranslation('common');
    const meta = notificationTypeMeta(toast.type);
    const Icon = meta.icon;
    return (
        <div
            role="status"
            className={`pointer-events-auto animate-toast-in flex items-start gap-3 rounded-xl border border-border ${meta.ring} border-l-4 bg-surface shadow-2xl px-4 py-3`}
        >
            <div className={`mt-0.5 w-8 h-8 shrink-0 rounded-lg ${meta.soft} ${meta.accent} flex items-center justify-center`}>
                <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text leading-snug">{toast.title}</p>
                {toast.message && <p className="text-xs text-text-muted mt-0.5 leading-snug line-clamp-3">{toast.message}</p>}
            </div>
            <button
                onClick={onClose}
                className="shrink-0 -mr-1 -mt-1 w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                aria-label={t('actions.close')}
            >
                <X size={14} />
            </button>
        </div>
    );
}

/** Bildirim altyapısının tamamı (notify + geçmiş). */
export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
}

/** Sadece notify fonksiyonu lazım olduğunda kısayol. */
export function useNotify() {
    return useNotifications().notify;
}

export { Bell };
