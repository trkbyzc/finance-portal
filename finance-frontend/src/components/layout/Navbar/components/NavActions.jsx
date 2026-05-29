import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NavActions() {
    const { t } = useTranslation('markets');
    return (
        <div className="flex items-center gap-4 shrink-0">
            <Link to="/markets/live" className="hidden lg:flex items-center gap-2 bg-sell/10 text-sell px-3 py-1.5 rounded-md border border-sell/20 hover:bg-sell/20 transition-colors mr-2">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sell opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sell"></span>
                </span>
                <span className="text-sm font-bold tracking-wider animate-pulse whitespace-nowrap">{t('ticker.live')} {t('ticker.marketStatus')}</span>
            </Link>
        </div>
    );
}
