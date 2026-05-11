import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { currencyApi } from '../../services/api';

import BankCurrencyHeader from './components/BankCurrencyHeader';
import BankCurrencyTabs from './components/BankCurrencyTabs';
import BankRateCard from './components/BankRateCard';

export default function BankCurrenciesPage() {
    const [selectedCurrency, setSelectedCurrency] = useState('USD');

    const { data: rates = [], isLoading: loading } = useQuery({
        queryKey: ['bankCurrenciesData'],
        queryFn: async () => {
            const data = await currencyApi.getBankCurrencies();
            return data || [];
        },
        staleTime: 60 * 1000
    });

    const filteredRates = rates.filter(r => r.currencyCode === selectedCurrency);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#0b0e14]">
            <Loader2 className="animate-spin text-[#2962ff]" size={48} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <BankCurrencyHeader />
                <BankCurrencyTabs selectedCurrency={selectedCurrency} setSelectedCurrency={setSelectedCurrency} />

                {filteredRates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredRates.map((bank, i) => (
                            <BankRateCard key={i} rate={bank} />
                        ))}
                    </div>
                ) : (
                    <div className="w-full p-8 text-center text-[#868993] bg-[#131722] rounded-2xl border border-[#2a2e39]">
                        Bu döviz cinsi için güncel banka verisi bulunamadı.
                    </div>
                )}
            </div>
        </div>
    );
}