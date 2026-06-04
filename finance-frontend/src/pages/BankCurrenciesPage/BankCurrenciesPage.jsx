import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { currencyApi } from '../../services/api';

import BankCurrencyHeader from './components/BankCurrencyHeader';
import BankCurrencyTabs from './components/BankCurrencyTabs';
import BankRateCard from './components/BankRateCard';

// Sadece TCMB döviz sayfasıyla aynı 12 kur gösterilir (HesapKurdu daha fazlasını
// dönse de AED/BGN/CNY/KWD/RON gibi ekstralar listelenmez).
const ALLOWED = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'DKK', 'SEK', 'NOK', 'SAR', 'RUB'];

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

    // Sadece izinli 12 kurdan veride mevcut olanlar, TCMB sırasında
    const availableCurrencies = useMemo(() => {
        const present = new Set(rates.map(r => r.currencyCode).filter(Boolean));
        return ALLOWED.filter(code => present.has(code));
    }, [rates]);

    const filteredRates = rates.filter(r => r.currencyCode === selectedCurrency);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-bg">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <div className="min-h-screen bg-bg text-text">
            <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
                <BankCurrencyHeader />
                <BankCurrencyTabs currencies={availableCurrencies} selectedCurrency={selectedCurrency} setSelectedCurrency={setSelectedCurrency} />

                {filteredRates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredRates.map((bank, i) => (
                            <BankRateCard key={i} rate={bank} />
                        ))}
                    </div>
                ) : (
                    <div className="w-full p-8 text-center text-text-muted bg-surface rounded-2xl border border-border">
                        Bu döviz cinsi için güncel banka verisi bulunamadı.
                    </div>
                )}
            </div>
        </div>
    );
}