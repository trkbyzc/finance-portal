import { apiClient } from '../../config/apiClient';

export const indexApi = {
    getIndices: () => apiClient.get('/market-data/indices'),
    getViop: () => apiClient.get('/market-data/viop'),
    getFutures: () => apiClient.get('/market-data/futures')
};