import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import TurkishStocksDashboard from './dashboards/TurkishStocksDashboard/TurkishStocksDashboard';
import UsStocksDashboard from './dashboards/UsStocksDashboard/UsStocksDashboard';
import ViopDashboard from './dashboards/ViopDashboard/ViopDashboard';
import GlobalFuturesDashboard from './dashboards/GlobalFuturesDashboard/GlobalFuturesDashboard';
import CurrenciesDashboard from './dashboards/CurrenciesDashboard/CurrenciesDashboard';
import EffectiveCurrenciesDashboard from './dashboards/EffectiveCurrenciesDashboard/EffectiveCurrenciesDashboard';
import CryptoDashboard from './dashboards/CryptoDashboard/CryptoDashboard';
import CommoditiesDashboard from './dashboards/CommodityDashboard/CommoditiesDashboard';
import GlobalBondsDashboard from './dashboards/GlobalBondsDashboard/GlobalBondsDashboard';
import TurkishBondsDashboard from './dashboards/TurkishBondsDashboard/TurkishBondsDashboard';
import EconomyDashboard from './dashboards/EconomyDashboard/EconomyDashboard';
import EurobondDashboard from './dashboards/EurobondDashboard/EurobondDashboard';
import TurkishFundsDashboard from './dashboards/TurkishFundsDashboard/TurkishFundsDashboard';
import GlobalFundsDashboard from './dashboards/GlobalFundsDashboard/GlobalFundsDashboard';

import ShowcaseSlider from './dashboards/CurrenciesDashboard/components/ShowcaseSlider';
import MainChartArea from './dashboards/CurrenciesDashboard/components/MainChartArea';
import MiniListsSection from './dashboards/CurrenciesDashboard/components/MiniListsSection';

export default function MarketPage() {
    const { category } = useParams();
    const { t } = useTranslation('markets');

    if (category === 'tr-stocks') {
        return <TurkishStocksDashboard category={category} />;
    }

    if (category === 'us-stocks') {
        return <UsStocksDashboard category={category} />;
    }

    if (category === 'viop') {
        return <ViopDashboard category={category} />;
    }

    // 3b. Küresel Vadeliler (Global Futures — ES/NQ/GC/CL vs Yahoo Futures)
    if (category === 'futures') {
        return <GlobalFuturesDashboard category={category} />;
    }

    if (category === 'currencies') {
        return <CurrenciesDashboard category={category} />;
    }

    // 4b. Efektif Döviz (nakit/banknot kurları — TCMB Banknote + EVDS *.EF.YTL)
    if (category === 'effective-currencies') {
        return <EffectiveCurrenciesDashboard category={category} />;
    }

    if (category === 'crypto') {
        return <CryptoDashboard category={category} />;
    }

    if (category === 'commodities') {
        return <CommoditiesDashboard category={category} />;
    }

    if (category === 'bonds') {
        return <GlobalBondsDashboard category={category} />;
    }

    if (category === 'tr-bonds') {
        return <TurkishBondsDashboard category={category} />;
    }

    // Ekonomi — TCMB EVDS makro göstergeleri dashboard'u
    if (category === 'economy') {
        return <EconomyDashboard category={category} />;
    }

    // Türkiye Eurobond (FRED TR10Y + EVDS aggregate)
    if (category === 'eurobonds') {
        return <EurobondDashboard category={category} />;
    }

    // Türk Fonları (TEFAS)
    if (category === 'tr-funds') {
        return <TurkishFundsDashboard category={category} />;
    }

    if (category === 'global-funds') {
        return <GlobalFundsDashboard category={category} />;
    }

    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-6 lg:p-10">
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-text mb-6">
                {category.replace('-', ' ')} {t('common.headerLive')}
            </h1>
            <ShowcaseSlider category={category} />
            <MainChartArea category={category} />
            <MiniListsSection category={category} />
        </div>
    );
}