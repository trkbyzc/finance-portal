import { apiClient } from '../../config/apiClient';

export const economyApi = {
    getHalkaArz: () => apiClient.get('/market-data/ipo'),
    getMacroEconomy: () => apiClient.get('/market-data/economy'),
    getHistoricalEconomy: (metric, range) =>
        apiClient.get('/market-data/economy/historical', { params: { metric, range } }),
    calculateInterest: (amount, days) =>
        apiClient.get('/interest/calculate', { params: { amount, days } })
};