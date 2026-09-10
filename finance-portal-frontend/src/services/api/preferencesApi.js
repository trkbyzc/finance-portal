import { apiClient } from '../../config/apiClient';

export const preferencesApi = {
    /** GET /api/users/me/preferences → { tickers: [{symbol, assetType}], tickerScope: 'ALL_PAGES'|'HOME_ONLY' } */
    getMyPreferences: async () => apiClient.get('/users/me/preferences'),

    /** PUT same body — bulk replace. */
    updateMyPreferences: async ({ tickers, tickerScope }) =>
        apiClient.put('/users/me/preferences', { tickers, tickerScope })
};
