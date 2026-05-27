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
                // SellModal market price gönderir → backend SELL audit'i gerçek işlem fiyatıyla yazar.
                // 0 veya yoksa backend fallback olarak averagePrice (cost-basis) kullanır.
                price: data.averagePrice ?? 0
            }
        });
    },

    // Track C: pageable transaction history. params = {symbol, fromDate, toDate, page, size}.
    // Backend Spring Page<TransactionDto> döner: { content, totalElements, totalPages, number, size, ... }.
    getTransactions: async (params = {}) => {
        return await apiClient.get('/portfolio/transactions', { params });
    },
};
