import React from 'react';
import { useTranslation } from 'react-i18next';
import TopMoversSidebar from './components/TopMoversSidebar.jsx';
import StockListTable from './components/StockListTable.jsx';
import BistInfoCards from './components/BistInfoCards.jsx';
import NewsSection from '../../../../components/news/NewsSection.jsx';

export default function TurkishStocksDashboard({ category }) {
    const { t } = useTranslation('markets');
    return (
        <div className="min-h-screen bg-bg text-text p-6 lg:p-10">

            <div className="mb-8">
                <h1 className="text-3xl font-black uppercase text-text tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-primary rounded-full"></span>
                    {t('stocks.headerTitle')}
                </h1>
                <p className="text-text-muted text-sm mt-2 ml-5">
                    {t('stocks.headerSubtitle')}
                </p>
            </div>

            <BistInfoCards />

            <div className="flex flex-col lg:flex-row gap-6">

                <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-6">
                    <TopMoversSidebar type="gainers" />
                    <TopMoversSidebar type="losers" />
                </div>

                <div className="w-full lg:w-2/3 xl:w-3/4 bg-surface border border-border rounded-xl shadow-2xl p-6">
                    <StockListTable />
                </div>

            </div>

            <NewsSection category="Borsa" titleKey="news:categories.stock" accent="primary" />
        </div>
    );
}
