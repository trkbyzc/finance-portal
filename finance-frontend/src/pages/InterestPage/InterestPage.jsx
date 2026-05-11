import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { economyApi } from '../../services/api';
import MarketTicker from '../../components/layout/MarketTicker/MarketTicker.jsx';
import InterestHeader from './components/InterestHeader';
import InterestCalculatorForm from './components/InterestCalculatorForm';
import InterestResultList from './components/InterestResultList';

export default function InterestPage() {
    const [amount, setAmount] = useState(100000);
    const [days, setDays] = useState(32);

    const presetDays = [32, 46, 92, 181, 365];

    // 🚀 React Query! State'leri de parametre olarak atıyoruz. Eğer parametreler değişirse arka planda yeniden fetch eder.
    const { data: results = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['interestCalculate', amount, days], // Amount veya Days değişirse query tetiklenmek üzere kilitlenir
        queryFn: async () => {
            const data = await economyApi.calculateInterest(amount, days);
            return data || [];
        },
        enabled: true, // Sayfa yüklendiğinde otomatik çeksin
        staleTime: 5 * 60 * 1000 // Ayn miktarı tekrar tekrar denerse 5 dk Cash'ten okusun
    });

    const handleCalculate = (e) => {
        e.preventDefault();
        // Eğer kullanıcı formdaki hesapla butonuna basarsa Query'yi zorla yenileriz
        refetch();
    };

    return (
        <div className="flex flex-col min-h-screen">
            <MarketTicker />
            <div className="max-w-[1200px] mx-auto p-4 md:p-8 text-white w-full mt-4">
                <InterestHeader />
                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4">
                        <InterestCalculatorForm
                            amount={amount} setAmount={setAmount}
                            days={days} setDays={setDays}
                            loading={loading}
                            handleCalculate={handleCalculate}
                            presetDays={presetDays}
                        />
                    </div>
                    <div className="lg:col-span-8">
                        <InterestResultList results={results} loading={loading} />
                    </div>
                </div>
            </div>
        </div>
    );
}