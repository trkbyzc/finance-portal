import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aggregateApi, currencyApi } from '../services/api';

export const useDashboardData = () => {
    const [activeTab, setActiveTab] = useState('stocks');

    const [calcAmount, setCalcAmount] = useState(1000);
    const [calcCurrency, setCalcCurrency] = useState('USD');

    const { data: currenciesData } = useQuery({
        queryKey: ['dashboardCurrencies'],
        queryFn: currencyApi.getAllCurrencies,
    });

    // currenciesData her güncellendiğinde USD/EUR kurlarını yeniden türetmemek için memoize edildi
    const { usdRate, eurRate } = useMemo(() => {
        if (!currenciesData || !Array.isArray(currenciesData)) {
            return { usdRate: 0, eurRate: 0 };
        }
        const usd = currenciesData.find(c => c.currencyCode === 'USD');
        const eur = currenciesData.find(c => c.currencyCode === 'EUR');
        return {
            usdRate: usd?.forexSelling || usd?.price || 0,
            eurRate: eur?.forexSelling || eur?.price || 0
        };
    }, [currenciesData]);

    const { data: tabData = [], isLoading: tabLoading } = useQuery({
        queryKey: ['dashboardTab', activeTab],
        queryFn: async () => {
            let res;
            switch (activeTab) {
                case 'stocks': res = await aggregateApi.getMarketsByEndpoint('/stocks'); break;
                case 'indices': res = await aggregateApi.getMarketsByEndpoint('/indices'); break;
                case 'crypto': res = await aggregateApi.getMarketsByEndpoint('/crypto-currencies'); break;
                case 'currencies': res = await aggregateApi.getMarketsByEndpoint('/currencies'); break;
                case 'commodities': res = await aggregateApi.getMarketsByEndpoint('/commodities'); break;
                case 'bonds': res = await aggregateApi.getMarketsByEndpoint('/bonds'); break;
                default: res = await aggregateApi.getMarketsByEndpoint('/stocks'); break;
            }
            // Vitrin olduğu için sadece ilk 6 veriyi göster
            return (res || []).slice(0, 6);
        },
    });

    const rateToUse = calcCurrency === 'USD' ? usdRate : eurRate;
    const calculatedResult = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 })
        .format(calcAmount * (rateToUse || 0));

    return {
        activeTab, setActiveTab,
        tabData, tabLoading,
        calcAmount, setCalcAmount,
        calcCurrency, setCalcCurrency,
        calculatedResult,
        usdRate, eurRate
    };
};