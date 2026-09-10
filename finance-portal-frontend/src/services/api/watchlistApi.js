import { apiClient } from '../../config/apiClient';

export const watchlistApi = {
    getMyWatchlist: async () => apiClient.get('/watchlist/me'),
    addToWatchlist: async ({ symbol, assetType }) =>
        apiClient.post('/watchlist/add', { symbol, assetType }),
    removeFromWatchlist: async (itemId) =>
        apiClient.delete(`/watchlist/remove/${itemId}`)
};
