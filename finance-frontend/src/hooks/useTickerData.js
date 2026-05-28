import { useQuery } from '@tanstack/react-query';
import { aggregateApi } from '../services/api';
import { useMemo } from 'react';
import useUserPreferences from './useUserPreferences';

/**
 * Auth user'ın preferences.tickers'ı varsa onu kullanır; yoksa varsayılan 5 majör varlık.
 *
 * Symbol matching: aggregate response'ta currency/crypto'da `currencyCode`,
 * diğerlerinde `symbol` field'ı kullanılıyor. AssetType'a göre doğru havuza bakıyoruz.
 */
const DEFAULT_FALLBACK_FINDER = (allItems) => {
    const usd = allItems.find(i => i.currencyCode === 'USD' || i.symbol === 'USD');
    const eur = allItems.find(i => i.currencyCode === 'EUR' || i.symbol === 'EUR');
    const gramAltin = allItems.find(i => i.symbol === 'GAU' || (i.name && i.name.toUpperCase().includes('GRAM')));
    const bist100 = allItems.find(i => i.symbol === 'XU100' || i.symbol === 'XU100.IS' || i.name === 'BIST 100');
    const btc = allItems.find(i => i.currencyCode === 'BTC' || i.symbol === 'BTC');
    return [usd, eur, gramAltin, bist100, btc].filter(Boolean);
};

/** AssetType başına aggregate response'taki ilgili list anahtarları. */
const POOL_KEYS = {
    STOCK: ['indices', 'stocks'],
    CRYPTO: ['cryptos'],
    CURRENCY: ['currencies'],
    COMMODITY: ['commodities', 'turkish_gold'],
    BOND: ['global_bonds', 'tr_bonds', 'eurobonds'],
    FUND: ['tr_funds', 'global_funds']
};

function findAsset(allMarkets, symbol, assetType) {
    const keys = POOL_KEYS[assetType] || [];
    for (const k of keys) {
        const list = allMarkets[k] || [];
        const hit = list.find(i =>
            i.symbol === symbol ||
            i.currencyCode === symbol ||
            i.code === symbol
        );
        if (hit) return hit;
    }
    return null;
}

export const useTickerData = () => {
    const { data: allMarkets, isLoading: marketsLoading } = useQuery({
        queryKey: ['tickerData'],
        queryFn: aggregateApi.getAllMarkets,
        staleTime: 30 * 1000,
        refetchInterval: 30 * 1000
    });

    const { preferences } = useUserPreferences();

    const tickerData = useMemo(() => {
        if (!allMarkets) return [];

        // Kullanıcı kendi listesini seçtiyse onu kullan
        const customList = preferences?.tickers;
        if (customList && customList.length > 0) {
            return customList
                .map(t => findAsset(allMarkets, t.symbol, t.assetType))
                .filter(Boolean);
        }

        // Yoksa varsayılan 5
        const allItems = [
            ...(allMarkets.indices || []),
            ...(allMarkets.currencies || []),
            ...(allMarkets.cryptos || []),
            ...(allMarkets.commodities || []),
            ...(allMarkets.turkish_gold || []),
            ...(allMarkets.stocks || [])
        ];
        return DEFAULT_FALLBACK_FINDER(allItems);
    }, [allMarkets, preferences]);

    return { tickerData, isLoading: marketsLoading };
};
