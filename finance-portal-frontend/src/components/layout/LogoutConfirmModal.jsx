import { useEffect } from 'react';
import { LogOut, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Çıkış onayı — uygulama içi pop-up. Arka planda en son kalınan sayfa bulanık görünür
 * (backdrop-blur). Onaylanınca Keycloak'a id_token_hint ile gidilir (Keycloak kendi onay
 * sayfasını atlar). İptal edilince sadece modal kapanır, oturum korunur.
 */
export default function LogoutConfirmModal({ open, onConfirm, onCancel }) {
    const { t } = useTranslation('navbar');

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            onClick={onCancel}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full p-7 text-center animate-fade-in"
                role="dialog"
                aria-modal="true"
            >
                <div className="w-14 h-14 rounded-2xl bg-sell/10 border border-sell/30 flex items-center justify-center text-sell mx-auto mb-5">
                    <AlertTriangle size={26} />
                </div>
                <h2 className="text-xl font-black text-text mb-2">{t('logoutConfirm.title')}</h2>
                <p className="text-text-muted text-sm leading-relaxed mb-6">{t('logoutConfirm.body')}</p>

                <button
                    onClick={onConfirm}
                    className="w-full py-3 rounded-xl bg-sell hover:brightness-110 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-sell/25 transition-all"
                >
                    <LogOut size={18} /> {t('logoutConfirm.confirm')}
                </button>
                <button
                    onClick={onCancel}
                    className="mt-3 text-sm text-text-muted hover:text-text font-semibold transition-colors"
                >
                    « {t('logoutConfirm.cancel')}
                </button>
            </div>
        </div>
    );
}
