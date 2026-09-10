import { describe, it, expect, vi, beforeEach } from 'vitest';

const { apiMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../config/apiClient', () => ({ apiClient: apiMock }));

import { portfolioApi } from './portfolioApi';

beforeEach(() => {
    Object.values(apiMock).forEach(m => m.mockReset());
    apiMock.get.mockResolvedValue([]);
    apiMock.post.mockResolvedValue({});
    apiMock.put.mockResolvedValue({});
    apiMock.delete.mockResolvedValue({});
});

describe('portfolioApi', () => {
    it('getPortfolios → GET /portfolio/list', async () => {
        await portfolioApi.getPortfolios();
        expect(apiMock.get).toHaveBeenCalledWith('/portfolio/list');
    });

    it('createPortfolio → POST {name}', async () => {
        await portfolioApi.createPortfolio('Yeni');
        expect(apiMock.post).toHaveBeenCalledWith('/portfolio/list', { name: 'Yeni' });
    });

    it('renamePortfolio → PUT /list/:id', async () => {
        await portfolioApi.renamePortfolio(7, 'Rename');
        expect(apiMock.put).toHaveBeenCalledWith('/portfolio/list/7', { name: 'Rename' });
    });

    it('deletePortfolio → DELETE /list/:id', async () => {
        await portfolioApi.deletePortfolio(3);
        expect(apiMock.delete).toHaveBeenCalledWith('/portfolio/list/3');
    });

    it('getMyPortfolio with id → params {portfolioId}', async () => {
        await portfolioApi.getMyPortfolio(5);
        expect(apiMock.get).toHaveBeenCalledWith('/portfolio/me', { params: { portfolioId: 5 } });
    });

    it('getMyPortfolio undefined → params {}', async () => {
        await portfolioApi.getMyPortfolio();
        expect(apiMock.get).toHaveBeenCalledWith('/portfolio/me', { params: {} });
    });

    it('getPortfolioSummary with id', async () => {
        await portfolioApi.getPortfolioSummary(11);
        expect(apiMock.get).toHaveBeenCalledWith('/portfolio/summary', { params: { portfolioId: 11 } });
    });

    it('addManualEntry → POST mapped body', async () => {
        await portfolioApi.addManualEntry({
            symbol: 'BTC', assetType: 'CRYPTO', quantity: 0.1, averagePrice: 50000, contractSize: 1, portfolioId: 9,
        });
        expect(apiMock.post).toHaveBeenCalledWith('/portfolio/add', {
            symbol: 'BTC', assetType: 'CRYPTO', quantity: 0.1, price: 50000, contractSize: 1, portfolioId: 9,
        });
    });

    it('updateManualEntry → PUT mapped body', async () => {
        await portfolioApi.updateManualEntry({
            symbol: 'BTC', assetType: 'CRYPTO', quantity: 1, averagePrice: 100, portfolioId: 2,
        });
        expect(apiMock.put).toHaveBeenCalledWith('/portfolio/update', {
            symbol: 'BTC', assetType: 'CRYPTO', quantity: 1, price: 100, portfolioId: 2,
        });
    });

    it('removeFromPortfolio → DELETE body, averagePrice fallback 0', async () => {
        await portfolioApi.removeFromPortfolio({
            symbol: 'X', assetType: 'STOCK', quantity: 1, portfolioId: 3,
        });
        expect(apiMock.delete).toHaveBeenCalledWith('/portfolio/remove', {
            data: { symbol: 'X', assetType: 'STOCK', quantity: 1, price: 0, portfolioId: 3 },
        });
    });

    it('removeFromPortfolio → averagePrice geçilirse o gönderilir', async () => {
        await portfolioApi.removeFromPortfolio({
            symbol: 'X', assetType: 'STOCK', quantity: 1, averagePrice: 250, portfolioId: 3,
        });
        expect(apiMock.delete.mock.calls[0][1].data.price).toBe(250);
    });

    it('getTransactions → GET with params', async () => {
        await portfolioApi.getTransactions({ symbol: 'A', page: 0, size: 20 });
        expect(apiMock.get).toHaveBeenCalledWith('/portfolio/transactions', {
            params: { symbol: 'A', page: 0, size: 20 }
        });
    });

    it('getTransactions no args → empty params', async () => {
        await portfolioApi.getTransactions();
        expect(apiMock.get).toHaveBeenCalledWith('/portfolio/transactions', { params: {} });
    });
});
