import { useQuery } from '@tanstack/react-query';
import { aggregateApi } from '../services/api';
import { useMemo } from 'react';

export const useTickerData = () => {
    const { data: allMarkets, isLoading } = useQuery({
        queryKey: ['tickerData'],
        queryFn: aggregateApi.getAllMarkets,
        staleTime: 30 * 1000, // 30 saniye cache
        refetchInterval: 30 * 1000 // 30 saniyede bir otomatik güncelle
    });

    const tickerData = useMemo(() => {
        if (!allMarkets) return [];

        // Tüm market verilerini tek bir havuza topla
        const allItems = [
            ...(allMarkets.indices || []),
            ...(allMarkets.currencies || []),
            ...(allMarkets.cryptos || []),
            ...(allMarkets.commodities || []),
            ...(allMarkets.turkish_gold || []),
            ...(allMarkets.stocks || [])
        ];

        // 🚀 İstenilen 5 majör varlığı özel olarak bul
        const usd = allItems.find(i => i.currencyCode === 'USD' || i.symbol === 'USD');
        const eur = allItems.find(i => i.currencyCode === 'EUR' || i.symbol === 'EUR');
        const gramAltin = allItems.find(i => i.symbol === 'GAU' || (i.name && i.name.toUpperCase().includes('GRAM')));
        const bist100 = allItems.find(i => i.symbol === 'XU100' || i.symbol === 'XU100.IS' || i.name === 'BIST 100');
        const btc = allItems.find(i => i.currencyCode === 'BTC' || i.symbol === 'BTC');

        // Bulunanları diziye ekle (null olanları filtrele ki hata vermesin)
        return [usd, eur, gramAltin, bist100, btc].filter(Boolean);
    }, [allMarkets]);

    return { tickerData, isLoading };
};