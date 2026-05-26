import { apiClient } from '../../config/apiClient';

export const whatIfApi = {
    compare: async (body) => apiClient.post('/what-if/compare', body)
};
