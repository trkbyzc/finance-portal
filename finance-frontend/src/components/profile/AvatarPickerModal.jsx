import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar, { PRESET_AVATARS, setStoredAvatarId } from './Avatar';
import { useAuth } from '../../context/AuthContext';

export default function AvatarPickerModal({ open, currentId, onClose }) {
    const { t } = useTranslation(['profile', 'common']);
    const { user } = useAuth();
    const [selectedId, setSelectedId] = useState(currentId);

    if (!open) return null;

    const handleSave = () => {
        setStoredAvatarId(user?.username, selectedId);
        onClose();
    };

    const handleClear = () => {
        setStoredAvatarId(user?.username, null);
        setSelectedId(null);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={onClose}
        >
            <div
                className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">{t('profile:avatar.modalTitle', 'Avatar Seç')}</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-sm text-text-muted mb-4">
                    {t('profile:avatar.modalSubtitle', 'Profilini temsil eden bir avatar seç. İstediğin zaman değiştirebilirsin.')}
                </p>

                <div className="grid grid-cols-4 gap-3 mb-5">
                    {PRESET_AVATARS.map((a) => {
                        const active = selectedId === a.id;
                        return (
                            <button
                                key={a.id}
                                type="button"
                                onClick={() => setSelectedId(a.id)}
                                className={`relative rounded-xl p-2 transition border-2 ${active ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border'}`}
                                aria-label={`select-avatar-${a.id}`}
                            >
                                <Avatar id={a.id} size={56} className="mx-auto" />
                                {active && (
                                    <div className="absolute top-1 right-1 bg-primary text-primary-fg rounded-full p-0.5 shadow-md">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
                    <button
                        onClick={handleClear}
                        className="text-sm text-text-muted hover:text-sell font-semibold"
                    >
                        {t('profile:avatar.useInitials', 'İlk harf kullan')}
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-bg transition"
                        >
                            {t('common:actions.cancel', 'İptal')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!selectedId}
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-hover text-primary-fg disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            {t('common:actions.save', 'Kaydet')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
