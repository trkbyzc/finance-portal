import { apiClient } from '../../config/apiClient';

export const aggregateApi = {
    getAllMarkets: async () => apiClient.get('/market-data/all'),
    getMarketsByEndpoint: async (endpoint) => apiClient.get(`/market-data${endpoint}`)
};