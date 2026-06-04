import { Ban, CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/formatters/dateFormatter';

/**
 * Banlı kullanıcı giriş yapınca gösterilen bilgi pop-up'ı.
 * Süreli ban'da kalan gün + hesabın açılacağı tarih; kalıcı ban'da kalıcı uyarısı.
 *
 * @param {{ message, banType, until, daysLeft }} info  apiClient'ın sessionStorage'a yazdığı ban detayı
 *   (daysLeft apiClient'ta hesaplanır → burada Date.now() çağrısı yok, render saf kalır)
 */
export default function BanNoticeModal({ info, onClose }) {
    const { t } = useTranslation('dashboard');
    if (!info) return null;

    const isPermanent = info.banType === 'PERMANENT' || !info.until;
    const unlockStr = !isPermanent && info.until ? formatDate(info.until) : null;
    const daysLeft = info.daysLeft;

    return (
        <div className="fixed inset-0 z-130 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full p-7 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-sell/10 border border-sell/30 flex items-center justify-center text-sell mx-auto mb-5">
                    <Ban size={30} />
                </div>

                <h2 className="text-xl font-black text-text mb-2">{t('ban.title')}</h2>

                <p className="text-text-muted text-sm leading-relaxed mb-5">
                    {isPermanent ? t('ban.permanentBody') : t('ban.tempBody')}
                </p>

                {!isPermanent && unlockStr && (
                    <div className="bg-surface-2 border border-border rounded-xl p-4 mb-6 flex flex-col gap-2">
                        <div className="flex items-center justify-center gap-2 text-sell font-bold">
                            <CalendarClock size={18} />
                            {t('ban.daysLeft', { days: daysLeft })}
                        </div>
                        <div className="text-text-muted text-sm">
                            {t('ban.unlockOn', { date: unlockStr })}
                        </div>
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-fg font-bold transition-all"
                >
                    {t('ban.close')}
                </button>
            </div>
        </div>
    );
}
