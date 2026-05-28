import React from 'react';
import { Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function GoldHeader() {
    const { t } = useTranslation('markets');
    return (
        <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-4 uppercase text-warning">
                <Coins className="text-warning" size={36} />
                {t('gold.headerTitle')}
            </h1>
            <p className="text-text-muted mt-2 ml-12">
                {t('gold.headerSubtitle')}
            </p>
        </div>
    );
}
