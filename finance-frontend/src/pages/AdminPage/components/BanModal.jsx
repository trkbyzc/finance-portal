import React from 'react';
import { X } from 'lucide-react';

/**
 * Kullanıcı banlama modal'ı — 4 süre opsiyonu (7g/30g/90g/kalıcı) radio + onay/iptal.
 * Kalıcı seçilince ek uyarı banner'ı gösterir.
 */
export default function BanModal({ user, duration, onDurationChange, onConfirm, onClose, isSubmitting, t }) {
    const options = [
        { value: '7', labelKey: 'admin:banModal.duration7' },
        { value: '30', labelKey: 'admin:banModal.duration30' },
        { value: '90', labelKey: 'admin:banModal.duration90' },
        { value: 'permanent', labelKey: 'admin:banModal.durationPermanent' }
    ];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-text-muted hover:text-text">
                    <X size={20} />
                </button>
                <h2 className="text-xl font-bold mb-1">{t('admin:banModal.title')}</h2>
                <p className="text-text-muted text-sm mb-5">
                    {t('admin:banModal.subtitle', { username: user.username })}
                </p>

                <div className="space-y-2 mb-5">
                    {options.map(opt => (
                        <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                            duration === opt.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-border-strong'
                        }`}>
                            <input
                                type="radio"
                                name="duration"
                                value={opt.value}
                                checked={duration === opt.value}
                                onChange={(e) => onDurationChange(e.target.value)}
                                className="accent-primary"
                            />
                            <span className="font-semibold flex-1">{t(opt.labelKey)}</span>
                            {opt.value === 'permanent' && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-sell/10 text-sell border border-sell/30">!</span>
                            )}
                        </label>
                    ))}
                </div>

                {duration === 'permanent' && (
                    <div className="bg-sell/10 border border-sell/30 rounded-lg p-3 mb-5 text-sell text-sm">
                        {t('admin:banModal.permanentWarning')}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-bg hover:bg-surface-hover border border-border font-semibold transition disabled:opacity-50"
                    >
                        {t('admin:banModal.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-sell hover:bg-sell/90 text-white font-semibold transition disabled:opacity-50"
                    >
                        {isSubmitting ? '…' : t('admin:banModal.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}
