import { apiClient } from '../../config/apiClient';

export const portfolioApi = {
    getPortfolios: async () => await apiClient.get('/portfolio/list'),
    createPortfolio: async (name) => await apiClient.post('/portfolio/list', { name }),
    renamePortfolio: async (portfolioId, name) => await apiClient.put(`/portfolio/list/${portfolioId}`, { name }),
    deletePortfolio: async (portfolioId) => await apiClient.delete(`/portfolio/list/${portfolioId}`),

    getMyPortfolio: async (portfolioId) => {
        return await apiClient.get('/portfolio/me', { params: portfolioId ? { portfolioId } : {} });
    },

    getPortfolioSummary: async (portfolioId) => {
        return await apiClient.get('/portfolio/summary', { params: portfolioId ? { portfolioId } : {} });
    },

    addManualEntry: async (data) => {
        return await apiClient.post('/portfolio/add', {
            symbol: data.symbol,
            assetType: data.assetType,
            quantity: data.quantity,
            price: data.averagePrice,
            contractSize: data.contractSize, // VİOP çarpanı (varsa); diğer varlıklarda backend 1 sayar
            direction: data.direction, // VİOP pozisyon yönü (LONG/SHORT); diğer varlıklarda backend null sayar
            portfolioId: data.portfolioId,
            purchaseDate: data.purchaseDate // alış tarihi → transaction.executedAt; reel K/Z / enflasyon bundan hesaplanır
        });
    },

    updateManualEntry: async (data) => {
        return await apiClient.put('/portfolio/update', {
            symbol: data.symbol,
            assetType: data.assetType,
            quantity: data.quantity,
            price: data.averagePrice,
            portfolioId: data.portfolioId
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
                price: data.averagePrice ?? 0,
                direction: data.direction, // VİOP'ta hangi yönlü pozisyonun (LONG/SHORT) kapatılacağını belirler
                portfolioId: data.portfolioId
            }
        });
    },

    // Track C: pageable transaction history. params = {symbol, fromDate, toDate, page, size}.
    // Backend Spring Page<TransactionDto> döner: { content, totalElements, totalPages, number, size, ... }.
    getTransactions: async (params = {}) => {
        return await apiClient.get('/portfolio/transactions', { params });
    },
};
