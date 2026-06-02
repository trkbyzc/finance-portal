import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Saate göre kişisel karşılama: Günaydın / İyi günler / İyi akşamlar / İyi geceler + kullanıcı adı.
 *   05–11 sabah · 12–17 öğlen · 18–21 akşam · diğer gece
 */
function greetingKey(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
}

export default function DashboardGreeting({ name }) {
    const { t } = useTranslation('dashboard');
    const hour = new Date().getHours();
    const greeting = t(`greeting.${greetingKey(hour)}`);
    const displayName = name || '';

    return (
        <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-text flex items-center gap-3">
                <span className="w-2 h-9 bg-primary rounded-full shrink-0"></span>
                <span>
                    {greeting}{displayName ? ', ' : ''}
                    <span className="text-primary">{displayName}</span>
                </span>
            </h1>
            <p className="text-text-muted text-sm mt-2 ml-5">{t('greeting.subtitle')}</p>
        </div>
    );
}
