import { apiClient } from '../../config/apiClient';

export const stockApi = {
    getAllStocks: () => apiClient.get('/market-data/stocks'),
    // Hisse temel verisi: aralık/hacim (Yahoo) + piyasa değeri/halka açıklık/sektör (İş Yatırım / TradingView)
    getFundamentals: (symbol) =>
        apiClient.get('/market-data/stock-fundamentals', { params: { symbol } }),
    // Kripto temel verisi (CoinGecko): piyasa değeri/sıra/24s aralık/arz/ATH
    getCryptoFundamentals: (id) =>
        apiClient.get('/market-data/crypto-fundamentals', { params: { id } }),
    // Crypto Fear & Greed Index (alternative.me) — tüm günlük geçmiş
    getFearGreed: () => apiClient.get('/market-data/fear-greed')
};