import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../config/apiClient';
import { useCurrency } from '../../../context/CurrencyContext';
import { nativeCurrencyForType } from '../../../utils/currencyConversion';

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
    const { usdRate } = useCurrency();
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
                    // Geniş aralık (1y): bazı TEFAS fonlarının son verisi >30 gün eski olabiliyor (feed durmuş)
                    // ve dar pencere boş [] dönüyor → fiyat 0 görünüyordu. 1y çekip son MEVCUT NAV'ı alıyoruz.
                    const chartData = await apiClient.get('/market-data/historical', {
                        params: { symbol: fund.symbol, category: 'TR_FUND', range: '1y', interval: '1d' }
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

    // Varlığın GÜNLÜK değişim % — piyasa verisinden (günlük durum grafiği için)
    const getDailyChange = (symbol, assetType) => {
        if (!marketData) return null;
        try {
            switch (assetType) {
                case 'STOCK':     return marketData.stocks?.find(s => s.symbol === symbol)?.changePercent;
                case 'CRYPTO':    return marketData.cryptos?.find(c => c.currencyCode === symbol)?.changePercent;
                case 'CURRENCY':  return marketData.currencies?.find(c => c.currencyCode === symbol)?.changePercent;
                case 'COMMODITY': return marketData.commodities?.find(c => c.symbol === symbol)?.changePercent;
                case 'BOND':      return marketData.bonds?.find(b => b.symbol === symbol)?.changePercent;
                case 'FUTURE':    return marketData.viop?.find(v => v.symbol === symbol)?.changePercent;
                default:          return null;
            }
        } catch {
            return null;
        }
    };

    const calculateProfitLoss = (item) => {
        // currentPrice/averagePrice varlığın KENDİ para biriminde (kripto/ABD hissesi → USD, TR → TRY).
        const currentPrice = getCurrentPrice(item.symbol, item.assetType) || item.currentPrice;
        // VİOP sözleşme büyüklüğü (çarpan); diğer varlıklarda 1. Nominal = fiyat × çarpan × adet.
        const multiplier = Number(item.contractSize) || 1;
        // Toplam/dağılım hesapları için her şeyi ORTAK TRY bazına çeviriyoruz; aksi halde farklı
        // para birimindeki değerler (USD kripto + TRY hisse) toplanırken tutarsızlık oluşuyordu.
        const native = nativeCurrencyForType(item.assetType, item.symbol);
        const rate = native === 'USD' ? (Number(usdRate) || 1) : 1; // native → TRY

        // VİOP: tam nominal değil TEMİNAT bağlanır → portföye katkı = teminat + K/Z (notional DEĞİL).
        // Yön (short) K/Z işaretini ters çevirir; yüzde bağlanan teminata göre = kaldıraçlı gerçek getiri.
        // Teminat backend DTO'sundan (giriş fiyatına göre sabit) gelir; K/Z canlı fiyatla burada hesaplanır.
        if (item.assetType === 'FUTURE') {
            const dirSign = String(item.direction || '').toUpperCase() === 'SHORT' ? -1 : 1;
            const pnlNative = ((Number(currentPrice) || 0) - (Number(item.averagePrice) || 0)) * item.quantity * multiplier * dirSign;
            const marginNative = Number(item.marginPosted) > 0
                ? Number(item.marginPosted)
                : (Number(item.averagePrice) || 0) * item.quantity * multiplier; // teminat bilinmiyorsa nominal (defansif fallback)
            const costValue = marginNative * rate;          // maliyet = bağlanan teminat (TRY)
            const profitLoss = pnlNative * rate;            // K/Z (TRY)
            const currentValue = costValue + profitLoss;    // portföye katkı = teminat + K/Z (TRY)
            const profitLossPercent = marginNative > 0 ? (pnlNative / marginNative) * 100 : 0;
            return { currentPrice, profitLoss, profitLossPercent, currentValue, costValue };
        }

        // Tahvil/eurobond: değerleme karmaşık (getiri↔temiz fiyat, kupon, vade) → BACKEND hesaplar
        // (PortfolioAnalyticsService bond dalı). Frontend backend DTO değerlerini kullanır; DİBS TRY,
        // eurobond USD → güncel kurla TRY'ye çevrilir (toplam/dağılım tutarlı olsun).
        if (item.assetType === 'BOND') {
            const isDibs = String(item.symbol || '').startsWith('TP.');
            const bondRate = isDibs ? 1 : (Number(usdRate) || 1);
            return {
                currentPrice: Number(item.currentPrice) || 0, // DİBS → getiri, eurobond → temiz fiyat
                profitLoss: (Number(item.profitLoss) || 0) * bondRate,
                profitLossPercent: Number(item.profitLossPct) || 0,
                currentValue: (Number(item.currentValue) || 0) * bondRate,
                costValue: (Number(item.totalCost) || 0) * bondRate
            };
        }

        const currentValue = (Number(currentPrice) || 0) * rate * item.quantity * multiplier; // TRY
        const costValue = (Number(item.averagePrice) || 0) * rate * item.quantity * multiplier; // TRY
        const profitLoss = currentValue - costValue; // TRY
        const profitLossPercent = item.averagePrice
            ? ((currentPrice - item.averagePrice) / item.averagePrice) * 100
            : 0;
        // currentPrice native kalır (tablodaki birim fiyat sütunları için); değer/maliyet/K-Z TRY.
        return { currentPrice, profitLoss, profitLossPercent, currentValue, costValue };
    };

    return { getCurrentPrice, getDailyChange, calculateProfitLoss };
}
