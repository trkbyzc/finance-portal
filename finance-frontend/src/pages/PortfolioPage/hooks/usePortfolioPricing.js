import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../config/apiClient';

/**
 * Portföydeki holdings için canlı fiyat hesaplama altyapısı.
 *
 * 3 ayrı query var:
 *   1. marketData       — sembol→fiyat lookup için 6 ayrı market endpoint'ini paralel çeker
 *   2. fundPrices       — TR fonlar için historical'dan son fiyatı tek tek çeker
 *                          (TR_FUND category lazım, aggregate listede 0 dönebiliyor)
 *
 * `getCurrentPrice(symbol, assetType)` → number | null
 * `calculateProfitLoss(item)` → { currentPrice, profitLoss, profitLossPercent, currentValue }
 *
 * PortfolioPage 30+ satır boilerplate'i bu hook'a taşıdı.
 */
export default function usePortfolioPricing(portfolio) {
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

    const { data: fundPrices } = useQuery({
        queryKey: ['fundPrices', portfolio],
        queryFn: async () => {
            if (!portfolio) return {};
            const funds = portfolio.filter(item => item.assetType === 'FUND');
            if (funds.length === 0) return {};
            const pricePromises = funds.map(async (fund) => {
                try {
                    const chartData = await apiClient.get('/market-data/historical', {
                        params: { symbol: fund.symbol, category: 'TR_FUND', range: '1d', interval: '1d' }
                    });
                    if (chartData && chartData.length > 0) {
                        return { symbol: fund.symbol, price: chartData[chartData.length - 1].price };
                    }
                } catch (error) {
                    console.warn(`Fund price fetch failed: ${fund.symbol}`, error);
                }
                return { symbol: fund.symbol, price: 0 };
            });
            const prices = await Promise.all(pricePromises);
            return prices.reduce((acc, item) => {
                acc[item.symbol] = item.price;
                return acc;
            }, {});
        },
        enabled: !!portfolio && portfolio.some(item => item.assetType === 'FUND'),
        staleTime: 30_000
    });

    const getCurrentPrice = (symbol, assetType) => {
        if (!marketData) return null;
        try {
            switch (assetType) {
                case 'STOCK':     return marketData.stocks?.find(s => s.symbol === symbol)?.price;
                case 'CRYPTO':    return marketData.cryptos?.find(c => c.currencyCode === symbol)?.forexSelling;
                case 'CURRENCY':  return marketData.currencies?.find(c => c.currencyCode === symbol)?.forexSelling;
                case 'COMMODITY': return marketData.commodities?.find(c => c.symbol === symbol)?.price;
                case 'BOND':      return marketData.bonds?.find(b => b.symbol === symbol)?.price;
                case 'FUND':      return fundPrices?.[symbol] || null;
                case 'FUTURE':    return marketData.viop?.find(v => v.symbol === symbol)?.price;
                default:          return null;
            }
        } catch {
            return null;
        }
    };

    const calculateProfitLoss = (item) => {
        const currentPrice = getCurrentPrice(item.symbol, item.assetType) || item.currentPrice;
        // VİOP sözleşme büyüklüğü (çarpan); diğer varlıklarda 1. Nominal = fiyat × çarpan × adet.
        const multiplier = Number(item.contractSize) || 1;
        const profitLoss = (currentPrice - item.averagePrice) * item.quantity * multiplier;
        const profitLossPercent = ((currentPrice - item.averagePrice) / item.averagePrice) * 100;
        return { currentPrice, profitLoss, profitLossPercent, currentValue: currentPrice * item.quantity * multiplier };
    };

    return { getCurrentPrice, calculateProfitLoss };
}
