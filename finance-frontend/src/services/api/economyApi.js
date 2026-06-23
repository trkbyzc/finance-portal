import { apiClient } from '../../config/apiClient';

export const economyApi = {
    getHalkaArz: () => apiClient.get('/market-data/ipo'),
    getMacroEconomy: () => apiClient.get('/market-data/economy'),
    getHistoricalEconomy: (metric, range) =>
        apiClient.get('/market-data/economy/historical', { params: { metric, range } }),
    // Ekonomi göstergeleri kayıt defteri (Ekonomi dashboard sidebar)
    getIndicators: () => apiClient.get('/market-data/economy/indicators'),
    // TR enflasyon: cumulative endeks (raw CPI) — varlık-enflasyon overlay'i için
    getCumulativeInflation: (range) =>
        apiClient.get('/market-data/economy/historical', { params: { metric: 'cumulativeInflationRate', range } }),
    // ABD enflasyon: FRED CPIAUCSL raw endeks
    getEconomyUsHistorical: (range) =>
        apiClient.get('/market-data/economy-us/historical', { params: { metric: 'usdInflationRate', range } }),
    calculateInterest: (amount, days) =>
        apiClient.get('/interest/calculate', { params: { amount, days } }),
    // TRY mevduat faizi (1 yıla kadar) tarihsel serisi → [{date, rate}, ...] — Performans widget'ı
    // bu seriyi dönem boyunca bileşikleyerek "mevduata koysaydın" getirisini hesaplar.
    getDepositSeries: (range = '5y') =>
        apiClient.get('/interest/deposit-series', { params: { range } })
};
