import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { economyApi } from '../../services/api';
import InterestHeader from './components/InterestHeader';
import InterestCalculatorForm from './components/InterestCalculatorForm';
import InterestResultList from './components/InterestResultList';

export default function InterestPage() {
    const [amount, setAmount] = useState(100000);
    const [days, setDays] = useState(32);

    const presetDays = [32, 46, 92, 181, 365];

    // amount veya days değiştiğinde React Query arka planda otomatik yeniden fetch eder.
    const { data: results = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['interestCalculate', amount, days], // queryKey'e parametre eklenerek bağımlılık izlenir
        queryFn: async () => {
            const data = await economyApi.calculateInterest(amount, days);
            return data || [];
        },
        staleTime: 5 * 60 * 1000 // Aynı parametrelerle tekrar istek gelirse 5 dk cache'ten döner
    });

    const handleCalculate = (e) => {
        e.preventDefault();
        refetch();
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="max-w-[1200px] mx-auto p-4 md:p-8 text-text w-full mt-4">
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