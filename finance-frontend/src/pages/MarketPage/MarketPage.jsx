import React from 'react';
import { useParams } from 'react-router-dom';

// 🚀 İçe Aktarmalar
import TurkishStocksDashboard from './dashboards/TurkishStocksDashboard/TurkishStocksDashboard';
import UsStocksDashboard from './dashboards/UsStocksDashboard/UsStocksDashboard';
import ViopDashboard from './dashboards/ViopDashboard/ViopDashboard';
import CurrenciesDashboard from './dashboards/CurrenciesDashboard/CurrenciesDashboard';
import CryptoDashboard from './dashboards/CryptoDashboard/CryptoDashboard'; // 🚀 KRİPTO EKLENDİ
import CommoditiesDashboard from './dashboards/CommodityDashboard/CommoditiesDashboard';
import GlobalBondsDashboard from './dashboards/GlobalBondsDashboard/GlobalBondsDashboard';
import EurobondDashboard from './dashboards/EurobondDashboard/EurobondDashboard';
import TurkishFundsDashboard from './dashboards/TurkishFundsDashboard/TurkishFundsDashboard';
import GlobalFundsDashboard from './dashboards/GlobalFundsDashboard/GlobalFundsDashboard';

import ShowcaseSlider from './dashboards/CurrenciesDashboard/components/ShowcaseSlider';
import MainChartArea from './dashboards/CurrenciesDashboard/components/MainChartArea';
import MiniListsSection from './dashboards/CurrenciesDashboard/components/MiniListsSection';

export default function MarketPage() {
    const { category } = useParams();

    // 1. Borsa İstanbul
    if (category === 'tr-stocks') {
        return <TurkishStocksDashboard category={category} />;
    }

    // 2. ABD Hisseleri
    if (category === 'us-stocks') {
        return <UsStocksDashboard category={category} />;
    }

    // 3. VİOP
    if (category === 'viop') {
        return <ViopDashboard category={category} />;
    }

    // 4. Döviz Piyasası
    if (category === 'currencies') {
        return <CurrenciesDashboard category={category} />;
    }

    // 5.KRİPTO PİYASASI
    if (category === 'crypto') {
        return <CryptoDashboard category={category} />;
    }

    // 6.Emtia Piyasası
    if (category === 'commodities') {
        return <CommoditiesDashboard category={category} />;
    }

    // Küresel Tahviller
    if (category === 'bonds') {
        return <GlobalBondsDashboard category={category} />;
    }

    // Türkiye Eurobond (FRED TR10Y + EVDS aggregate)
    if (category === 'eurobonds') {
        return <EurobondDashboard category={category} />;
    }

    // Türk Fonları (TEFAS)
    if (category === 'tr-funds') {
        return <TurkishFundsDashboard category={category} />;
    }

    // Küresel Fonlar (ETF)
    if (category === 'global-funds') {
        return <GlobalFundsDashboard category={category} />;
    }

    // DEFAULT (JENERİK) VİTRİN
    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-6 lg:p-10">
            <h1 className="text-3xl font-black uppercase text-white mb-6">
                {category.replace('-', ' ')} Piyasası
            </h1>
            <ShowcaseSlider category={category} />
            <MainChartArea category={category} />
            <MiniListsSection category={category} />
        </div>
    );
}