import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
    const { user } = useAuth();
    const { t } = useTranslation(['profile', 'common']);

    return (
        <div className="min-h-screen bg-bg p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">{t('profile:pageTitle')}</h1>

                <div className="bg-surface-2 rounded-lg p-6 space-y-4">
                    <div className="border-b border-border pb-4">
                        <label className="text-text-muted text-sm">{t('profile:fields.username')}</label>
                        <p className="text-text text-lg font-semibold">{user?.username || '-'}</p>
                    </div>

                    <div className="border-b border-border pb-4">
                        <label className="text-text-muted text-sm">{t('profile:fields.email')}</label>
                        <p className="text-text text-lg">{user?.email || '-'}</p>
                    </div>

                    <div className="border-b border-border pb-4">
                        <label className="text-text-muted text-sm">{t('profile:fields.fullName')}</label>
                        <p className="text-text text-lg">{user?.name || '-'}</p>
                    </div>

                    <div>
                        <label className="text-text-muted text-sm">{t('common:labels.status')}</label>
                        <p className="text-buy text-lg font-semibold">✓ {t('common:status.active')}</p>
                    </div>
                </div>

                <div className="mt-6 text-text-muted text-sm">
                    <p>{t('profile:actions.manageInKeycloak')}</p>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
