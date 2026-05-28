import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Landmark, Ship, Coins, UserPlus, Star, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import MarketTicker from '../../components/layout/MarketTicker/MarketTicker.jsx';
import { useDashboardData } from '../../hooks/useDashboardData.js';
import Modal from '../../components/layout/Modal.jsx';

import DashboardHero from './components/DashboardHero';
import DashboardTabPanel from './components/DashboardTabPanel';
import DashboardCalculator from './components/DashboardCalculator';
import DashboardFeatures from './components/DashboardFeatures';

export default function Dashboard() {
    const navigate = useNavigate();
    const { t } = useTranslation('dashboard');
    const {
        activeTab, setActiveTab, tabData, tabLoading,
        calcAmount, setCalcAmount, calcCurrency, setCalcCurrency,
        calculatedResult, usdRate
    } = useDashboardData();

    const tabs = [
        { id: 'stocks', title: t('tabs.stocks'), icon: <Globe size={16}/> },
        { id: 'currencies', title: t('tabs.currencies'), icon: <Landmark size={16}/> },
        { id: 'commodities', title: t('tabs.commodities'), icon: <Ship size={16}/> },
        { id: 'crypto', title: t('tabs.crypto'), icon: <Coins size={16}/> }
    ];

    const [banModal, setBanModal] = useState({ isOpen: false, msg: '' });

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('banned') === 'true') {
            const message = urlParams.get('msg') || t('errors.accessDeniedMessage');
            setBanModal({ isOpen: true, msg: message });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [t]);

    return (
        <div className="flex flex-col min-h-screen bg-bg text-text font-sans overflow-x-hidden">

            <Modal
                isOpen={banModal.isOpen}
                title={t('errors.accessDenied')}
                message={banModal.msg + "\n\n" + t('errors.accessDeniedDetail')}
                type="error"
                onClose={() => setBanModal({ isOpen: false, msg: '' })}
            />

            <MarketTicker />

            <section className="max-w-container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-12 md:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-center w-full">
                <DashboardHero navigate={navigate} />
                <DashboardTabPanel
                    tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}
                    tabData={tabData} tabLoading={tabLoading} navigate={navigate}
                />
            </section>

            <DashboardFeatures />

            <section className="max-w-container mx-auto px-4 md:px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center w-full">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                        <Star size={12} className="fill-primary" /> {t('cta.tagline')}
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-text">
                        {t('cta.titleLine1')}<br />
                        <span className="text-primary">{t('cta.titleLine2')}</span>
                    </h2>
                    <p className="text-text-muted text-base leading-relaxed max-w-md">
                        {t('cta.subtitle')}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        <div className="p-4 bg-surface border border-border rounded-xl flex items-center gap-3 group hover:border-primary/50 hover:bg-surface-hover transition-all">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Star size={18}/></div>
                            <span className="text-sm font-semibold text-text">{t('cta.favorites')}</span>
                        </div>
                        <div className="p-4 bg-surface border border-border rounded-xl flex items-center gap-3 group hover:border-buy/50 hover:bg-surface-hover transition-all">
                            <div className="w-10 h-10 rounded-lg bg-buy/10 flex items-center justify-center text-buy"><Bell size={18}/></div>
                            <span className="text-sm font-semibold text-text">{t('cta.priceAlerts')}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/register')}
                        className="mt-2 px-6 py-3 bg-primary hover:bg-primary-hover text-primary-fg rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
                    >
                        <UserPlus size={18} /> {t('cta.createAccount')}
                    </button>
                </div>

                <DashboardCalculator
                    calcAmount={calcAmount} setCalcAmount={setCalcAmount}
                    calcCurrency={calcCurrency} setCalcCurrency={setCalcCurrency}
                    calculatedResult={calculatedResult} usdRate={usdRate}
                />
            </section>
        </div>
    );
}
