import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData.js';
import NewsSection from '../../components/news/NewsSection.jsx';

import DashboardGreeting from './components/DashboardGreeting';
import MarketSummaryStrip from './components/MarketSummaryStrip';
import PortfolioSummaryWidget from './components/PortfolioSummaryWidget';
import WatchlistWidget from './components/WatchlistWidget';
import DashboardCalculator from './components/DashboardCalculator';

/**
 * Giriş yapmış kullanıcı dashboard'u — kişiye özel.
 *
 *   Karşılama (saate göre) → Piyasa özet şeridi →
 *   sol kolon: Portföy özeti + İzleme listesi · sağ kolon: Döviz çevirici + Haberler
 */
export default function AuthenticatedDashboard() {
    const { user } = useAuth();
    const {
        calcAmount, setCalcAmount, calcCurrency, setCalcCurrency,
        calculatedResult, usdRate
    } = useDashboardData();

    const displayName = user?.username || user?.name || '';

    return (
        <div className="bg-bg text-text font-sans">
            <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
                <DashboardGreeting name={displayName} />

                <MarketSummaryStrip />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sol: portföy + izleme */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <PortfolioSummaryWidget />
                        <WatchlistWidget />
                    </div>

                    {/* Sağ: döviz çevirici + haberler */}
                    <div className="flex flex-col gap-6">
                        <DashboardCalculator
                            calcAmount={calcAmount} setCalcAmount={setCalcAmount}
                            calcCurrency={calcCurrency} setCalcCurrency={setCalcCurrency}
                            calculatedResult={calculatedResult} usdRate={usdRate}
                        />
                        <NewsSection
                            category="Tümü"
                            titleKey="dashboard:widgets.newsTitle"
                            accent="primary"
                            limit={5}
                            className=""
                            gridClassName="grid grid-cols-1 gap-3"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
