import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NavActions() {
    const { t } = useTranslation('markets');
    return (
        <div className="flex items-center gap-4 shrink-0">
            <Link to="/markets/live" className="hidden 2xl:flex items-center gap-2 bg-sell/10 text-sell px-2.5 py-1 rounded-md border border-sell/20 hover:bg-sell/20 transition-colors mr-1">
                <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sell opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sell"></span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider animate-pulse leading-tight">{t('ticker.live')} {t('ticker.marketStatus')}</span>
            </Link>
        </div>
    );
}
