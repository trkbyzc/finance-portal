import { apiClient } from '../../config/apiClient';

export const historicalApi = {
    getData: async (params) => {
        // apiClient interceptor zaten response.data döndürüyor
        return await apiClient.get('/market-data/historical', { params });
    },

    getCustomRange: async (params) => {
        const customParams = { ...params, range: 'custom', interval: '1d' };
        return await apiClient.get('/market-data/historical', { params: customParams });
    },

    // Eski çağrı noktalarıyla backward compatibility için ayrı imza
    getHistoricalData: async (symbol, range) => {
        // apiClient interceptor zaten response.data döndürüyor
        return await apiClient.get('/market-data/historical', {
            params: { symbol, range }
        });
    }
};