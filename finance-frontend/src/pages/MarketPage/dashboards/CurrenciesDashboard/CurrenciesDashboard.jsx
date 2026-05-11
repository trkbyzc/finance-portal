import React, { useState, useMemo } from 'react';
import { useMarketData } from '../../../../hooks/useMarketData';
import { useNewsData } from '../../../../hooks/useNewsData'; // 🚀 Yeni Hook
import CurrencyHeader from './components/CurrencyHeader';
import MajorCurrencyCards from './components/MajorCurrencyCards';
import CurrencyTable from './components/CurrencyTable';
import CurrencyNewsSidebar from './components/CurrencyNewsSidebar';

export default function CurrenciesDashboard() {
    const { data: currencies, loading: isLoading } = useMarketData('currencies');
    const { news, loading: loadingNews } = useNewsData('Döviz Kurları'); // 🚀 Temiz çağrı
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCurrencies = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return currencies;
        return currencies.filter(c =>
            (c.currencyCode?.toLowerCase().includes(query)) ||
            (c.currencyName?.toLowerCase().includes(query))
        );
    }, [searchQuery, currencies]);

    const majorCurrencies = useMemo(() => {
        if (!currencies.length) return [];
        return currencies.filter(c => ['USD', 'EUR', 'GBP'].includes(c.currencyCode));
    }, [currencies]);

    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-6 lg:p-10">

            <CurrencyHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <MajorCurrencyCards
                currencies={majorCurrencies}
                loading={isLoading}
                show={!searchQuery}
            />

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-2/3 xl:w-3/4">
                    <CurrencyTable
                        data={filteredCurrencies}
                        loading={isLoading}
                    />
                </div>

                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <CurrencyNewsSidebar
                        news={news}
                        loading={loadingNews}
                    />
                </div>
            </div>
        </div>
    );
}