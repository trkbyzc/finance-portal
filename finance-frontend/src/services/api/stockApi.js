import { apiClient } from '../../config/apiClient';

export const stockApi = {
    getAllStocks: () => apiClient.get('/market-data/stocks'),
    // Hisse temel verisi: aralık/hacim (Yahoo) + piyasa değeri/halka açıklık/sektör (İş Yatırım)
    getFundamentals: (symbol) =>
        apiClient.get('/market-data/stock-fundamentals', { params: { symbol } })
};