import { useQuery } from '@tanstack/react-query';
import { aggregateApi } from '../services/api';
import { useMemo } from 'react';

/**
 * 🚀 FAZA 1: useEffect Temizliği
 * 🚀 FAZA 3: Service Layer Refactoring - aggregateApi kullanımı
 * MarketTicker component'i için veri sağlar
 * Eski: useEffect + axios + manuel state yönetimi
 * Yeni: React Query + otomatik cache + refetch
 */
export const useTickerData = () => {
    const { data: allMarkets, isLoading } = useQuery({
        queryKey: ['tickerData'],
        queryFn: aggregateApi.getAllMarkets,
        staleTime: 30 * 1000, // 30 saniye cache
        refetchInterval: 30 * 1000 // 30 saniyede bir otomatik güncelle
    });

    // Business Logic: Ticker için gerekli verileri filtrele ve birleştir
    const tickerData = useMemo(() => {
        if (!allMarkets) return [];

        const indices = (allMarkets.indices || []).slice(0, 3);
        const currencies = (allMarkets.currencies || []).slice(0, 3);
        const crypto = (allMarkets.crypto || []).slice(0, 3);

        return [...indices, ...currencies, ...crypto];
    }, [allMarkets]);

    return { tickerData, isLoading };
};
