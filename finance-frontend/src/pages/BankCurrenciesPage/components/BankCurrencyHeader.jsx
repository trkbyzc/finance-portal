import React from 'react';
import { Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BankCurrencyHeader() {
    const { t } = useTranslation('markets');
    return (
        <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-4 uppercase">
                <Landmark className="text-primary" size={36} />
                {t('currencies.bankHeaderTitle')}
            </h1>
            <p className="text-text-muted mt-2 ml-12">
                {t('currencies.bankHeaderSubtitle')}
            </p>
        </div>
    );
}
