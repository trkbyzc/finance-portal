import { apiClient } from '../../config/apiClient';

export const commodityApi = {
    getAllCommodities: () => apiClient.get('/market-data/commodities'),
    getTurkishGold: () => apiClient.get('/market-data/turkish-gold')
};