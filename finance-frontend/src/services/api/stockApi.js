import { apiClient } from '../../config/apiClient';

export const stockApi = {
    getAllStocks: () => apiClient.get('/market-data/stocks')
};