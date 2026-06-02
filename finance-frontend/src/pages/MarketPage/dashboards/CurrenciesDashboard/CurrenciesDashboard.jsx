import React, { useState, useMemo } from 'react';
import { useMarketData } from '../../../../hooks/useMarketData';
import { useNewsData } from '../../../../hooks/useNewsData';
import CurrencyHeader from './components/CurrencyHeader';
import MajorCurrencyCards from './components/MajorCurrencyCards';
import CurrencyTable from './components/CurrencyTable';
import CurrencyNewsSidebar from './components/CurrencyNewsSidebar';

// 🚀 Kemik kadromuz (Sıralamada en tepede duracaklar)
const MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF'];

export default function CurrenciesDashboard() {
    const { data: currencies, loading: isLoading } = useMarketData('currencies');
    const { news, loading: loadingNews } = useNewsData('Döviz & Forex');
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCurrencies = useMemo(() => {
        let result = currencies;
        const query = searchQuery.toLowerCase().trim();

        // 1. Önce arama (filtreleme) işlemini yap
        if (query) {
            result = currencies.filter(c =>
                (c.currencyCode?.toLowerCase().includes(query)) ||
                (c.currencyName?.toLowerCase().includes(query))
            );
        }

        // 2. Şimdi listeyi zekice sırala
        // Majörleri ayır ve bizim belirlediğimiz sıraya (USD, EUR, GBP, CHF) göre diz
        const majors = result.filter(c => MAJOR_CURRENCIES.includes(c.currencyCode || c.symbol))
            .sort((a, b) => MAJOR_CURRENCIES.indexOf(a.currencyCode || a.symbol) - MAJOR_CURRENCIES.indexOf(b.currencyCode || b.symbol));

        // Minörleri (kalanları) ayır ve kendi aralarında A'dan Z'ye sırala
        const minors = result.filter(c => !MAJOR_CURRENCIES.includes(c.currencyCode || c.symbol))
            .sort((a, b) => (a.currencyCode || a.symbol || '').localeCompare(b.currencyCode || b.symbol || ''));

        // İkisini birleştirip tabloya gönder
        return [...majors, ...minors];
    }, [searchQuery, currencies]);

    const majorCurrencies = useMemo(() => {
        if (!currencies.length) return [];
        return currencies.filter(c => ['USD', 'EUR', 'GBP'].includes(c.currencyCode));
    }, [currencies]);

    return (
        <div className="min-h-screen bg-bg text-text">
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">

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
                    {/* 🚀 Vitrine artık sıralanmış ve filtrelenmiş jilet gibi veri gidiyor */}
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
        </div>
    );
}