import { apiClient } from '../../config/apiClient';

export const bondFundApi = {
    getTrBonds: () => apiClient.get('/market-data/tr-bonds'),
    getGlobalBonds: () => apiClient.get('/market-data/bonds'),
    getTrFunds: () => apiClient.get('/market-data/tr-funds'),
    getGlobalFunds: () => apiClient.get('/market-data/global-funds'),

    // Eurobond
    getEurobondList: () => apiClient.get('/market-data/eurobonds'),
    getEurobondAggregate: () => apiClient.get('/market-data/eurobonds/aggregate')
};
