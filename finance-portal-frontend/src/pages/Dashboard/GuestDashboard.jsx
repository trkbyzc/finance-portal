import { useNavigate } from 'react-router-dom';
import { UserPlus, Star, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StocksIcon, CurrencyIcon, CommodityIcon, CryptoIcon, NewsIcon } from '../../components/ui/CategoryIcons';

import { useDashboardData } from '../../hooks/useDashboardData.js';
import { goToRegister } from '../../utils/keycloak';

import DashboardHero from './components/DashboardHero';
import DashboardTabPanel from './components/DashboardTabPanel';
import DashboardCalculator from './components/DashboardCalculator';
import DashboardFeatures from './components/DashboardFeatures';

/**
 * Misafir (giriş yapmamış) kullanıcı dashboard'u — sistemi tanıtan/üyeliğe çeken landing.
 * Giriş yapmış kullanıcı AuthenticatedDashboard'u görür; yönlendirme Dashboard.jsx'te.
 */
export default function GuestDashboard() {
    const navigate = useNavigate();
    const { t } = useTranslation('dashboard');
    const {
        activeTab, setActiveTab, tabData, tabLoading,
        calcAmount, setCalcAmount, calcCurrency, setCalcCurrency,
        calculatedResult, usdRate
    } = useDashboardData();

    const tabs = [
        { id: 'stocks', title: t('tabs.stocks'), icon: <StocksIcon size={18}/> },
        { id: 'currencies', title: t('tabs.currencies'), icon: <CurrencyIcon size={18}/> },
        { id: 'commodities', title: t('tabs.commodities'), icon: <CommodityIcon size={18}/> },
        { id: 'crypto', title: t('tabs.crypto'), icon: <CryptoIcon size={18}/> },
        { id: 'news', title: t('tabs.news'), icon: <NewsIcon size={18}/> }
    ];

    return (
        <div className="flex flex-col bg-bg text-text font-sans overflow-x-hidden">
            <section className="max-w-container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-12 md:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-center w-full *:min-w-0">
                <DashboardHero navigate={navigate} />
                <DashboardTabPanel
                    tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}
                    tabData={tabData} tabLoading={tabLoading} navigate={navigate}
                />
            </section>

            <DashboardFeatures />

            <section className="max-w-container mx-auto px-4 md:px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center w-full *:min-w-0">
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
                        onClick={goToRegister}
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
