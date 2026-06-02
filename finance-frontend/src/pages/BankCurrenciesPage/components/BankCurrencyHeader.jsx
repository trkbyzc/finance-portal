import React from 'react';
import { useTranslation } from 'react-i18next';

export default function BankCurrencyHeader() {
    const { t } = useTranslation('markets');
    return (
        <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-text tracking-tight flex items-center gap-3">
                <span className="w-2 h-8 bg-primary rounded-full"></span>
                {t('currencies.bankHeaderTitle')}
            </h1>
        </div>
    );
}
