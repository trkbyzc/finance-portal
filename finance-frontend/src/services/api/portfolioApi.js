import { apiClient } from '../../config/apiClient';

export const portfolioApi = {
    getMyPortfolio: async () => {
        return await apiClient.get('/portfolio/me');
    },

    getPortfolioSummary: async () => {
        return await apiClient.get('/portfolio/summary');
    },

    addManualEntry: async (data) => {
        return await apiClient.post('/portfolio/add', {
            symbol: data.symbol,
            assetType: data.assetType,
            quantity: data.quantity,
            price: data.averagePrice
        });
    },

    updateManualEntry: async (data) => {
        return await apiClient.put('/portfolio/update', {
            symbol: data.symbol,
            assetType: data.assetType,
            quantity: data.quantity,
            price: data.averagePrice
        });
    },

    removeFromPortfolio: async (data) => {
        return await apiClient.delete('/portfolio/remove', {
            data: {
                symbol: data.symbol,
                assetType: data.assetType,
                quantity: data.quantity,
                price: 0
            }
        });
    },
};
