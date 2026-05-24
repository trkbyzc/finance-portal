import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Modal({ isOpen, title, message, type = 'error', onClose, confirmText, showCancel = false, onCancel }) {
    const { t } = useTranslation('common');
    if (!isOpen) return null;

    const finalConfirmText = confirmText || t('actions.confirm');

    const typeStyles = {
        error: { bg: 'bg-sell', text: 'text-sell', soft: 'bg-sell/15', emoji: '⚠️' },
        warning: { bg: 'bg-warning', text: 'text-warning', soft: 'bg-warning/15', emoji: '🛡️' },
        success: { bg: 'bg-buy', text: 'text-buy', soft: 'bg-buy/15', emoji: '✅' },
        info: { bg: 'bg-primary', text: 'text-primary', soft: 'bg-primary/15', emoji: 'ℹ️' }
    };
    const style = typeStyles[type] || typeStyles.info;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
                <div className="p-6 text-center">
                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${style.soft} mb-4`}>
                        <span className={`text-3xl ${style.text}`}>{style.emoji}</span>
                    </div>

                    <h3 className={`text-xl font-bold mb-2 ${style.text}`}>{title}</h3>
                    <p className="text-text-muted text-sm mb-6 whitespace-pre-wrap leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3 justify-center">
                        {showCancel && (
                            <button
                                onClick={onCancel}
                                className="px-6 py-2.5 rounded-lg font-bold text-text bg-surface-2 hover:bg-surface-hover border border-border transition-all w-full"
                            >
                                {t('actions.cancel')}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={`px-6 py-2.5 rounded-lg font-bold text-primary-fg ${style.bg} hover:opacity-90 transition-all w-full shadow-md`}
                        >
                            {finalConfirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
