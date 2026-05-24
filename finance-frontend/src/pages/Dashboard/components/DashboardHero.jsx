import React from 'react';
import { Activity, ArrowRight, UserPlus, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DashboardHero({ navigate }) {
    const { t } = useTranslation('dashboard');
    return (
        <div className="space-y-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
                <Activity size={14} className="animate-pulse" /> {t('hero.tagline')}
            </div>

            <h1 className="text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-text">
                {t('hero.titleLine1')}
                <br />
                <span className="bg-linear-to-r from-primary via-primary to-buy bg-clip-text text-transparent">
                    {t('hero.titleLine2')}
                </span>
            </h1>

            <p className="text-lg text-text-muted max-w-lg leading-relaxed">
                {t('hero.subtitle')}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
                <button
                    onClick={() => navigate('/markets/live')}
                    className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-fg font-semibold flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
                >
                    {t('hero.exploreMarkets')} <ArrowRight size={18} />
                </button>
                <button
                    onClick={() => navigate('/register')}
                    className="px-6 py-3 rounded-xl bg-surface hover:bg-surface-hover border border-border hover:border-border-strong text-text font-semibold flex items-center gap-2 transition-all"
                >
                    <UserPlus size={18} /> {t('cta.createAccount')}
                </button>
            </div>

            <div className="flex items-center gap-6 pt-3 text-xs text-text-muted">
                <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-buy" />
                    {t('hero.stat1')}
                </div>
                <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-primary" />
                    {t('hero.stat2')}
                </div>
                <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-warning" />
                    {t('hero.stat3')}
                </div>
            </div>
        </div>
    );
}
