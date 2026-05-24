import React from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function InterestHeader() {
    const { t } = useTranslation('interest');
    return (
        <header className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-buy/10 border border-buy/20 text-buy text-sm font-medium mb-4">
                <TrendingUp size={16} /> {t('results.bestRate')}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold flex items-center justify-center md:justify-start gap-4 mb-4">
                <Calculator className="text-primary" size={40} /> {t('pageTitle')}
            </h1>
            <p className="text-text-muted text-lg max-w-2xl">
                {t('pageSubtitle')}
            </p>
        </header>
    );
}
