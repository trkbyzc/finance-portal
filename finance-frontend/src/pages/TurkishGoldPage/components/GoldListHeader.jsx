import React from 'react';
import { useTranslation } from 'react-i18next';

export default function GoldListHeader() {
    const { t } = useTranslation(['markets', 'common']);
    return (
        <div className="hidden md:flex items-center justify-between px-6 py-2 text-text-muted text-xs font-bold uppercase tracking-wider border-b border-border/50 mb-2">
            <div className="w-1/3">{t('common:labels.asset')}</div>
            <div className="w-1/3 text-center">{t('common:labels.buyRate')} / {t('common:labels.sellRate')}</div>
            <div className="w-1/3 text-right">{t('common:labels.change')}</div>
        </div>
    );
}
