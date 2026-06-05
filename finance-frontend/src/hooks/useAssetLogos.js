import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../config/apiClient';

/**
 * Tüm market verisinden (BİST/ABD hisse, kripto, emtia, tahvil, fon, VİOP) sembol bazlı
 * logo/ikon çözer. Portföy fiyatlamasıyla AYNI queryKey (['allMarketData']) kullanır →
 * React Query cache'i paylaşılır, ekstra istek atılmaz.
 *
 * getLogo(symbol, assetType) → logo URL | null  (null ise AssetIcon bayrağa/baş harflere düşer)
 */
export default function useAssetLogos() {
    const { data: marketData } = useQuery({
        queryKey: ['allMarketData'],
        queryFn: async () => {
            const [stocks, cryptos, currencies, commodities, bonds, funds, viop] = await Promise.all([
                apiClient.get('/market-data/stocks').catch(() => []),
                apiClient.get('/market-data/crypto-currencies').catch(() => []),
                apiClient.get('/market-data/currencies').catch(() => []),
                apiClient.get('/market-data/commodities').catch(() => []),
                apiClient.get('/market-data/bonds').catch(() => []),
                apiClient.get('/market-data/tr-funds').catch(() => []),
                apiClient.get('/market-data/viop').catch(() => [])
            ]);
            return { stocks, cryptos, currencies, commodities, bonds, funds, viop };
        },
        staleTime: 30_000
    });

    const getLogo = (symbol, assetType) => {
        if (!marketData || !symbol) return null;
        try {
            switch (assetType) {
                case 'STOCK':     return marketData.stocks?.find(s => s.symbol === symbol)?.image || null;
                case 'CRYPTO':    return marketData.cryptos?.find(c => c.currencyCode === symbol)?.image || null;
                case 'COMMODITY': return marketData.commodities?.find(c => c.symbol === symbol)?.image || null;
                case 'BOND':      return marketData.bonds?.find(b => b.symbol === symbol)?.image || null;
                case 'FUND':      return marketData.funds?.find(f => f.symbol === symbol)?.image || null;
                case 'FUTURE':    return marketData.viop?.find(v => v.symbol === symbol)?.image || null;
                default:          return null; // CURRENCY → AssetIcon currencyFlag'e düşer
            }
        } catch {
            return null;
        }
    };

    return { getLogo };
}
