import { apiClient } from '../../config/apiClient';

export const simulationApi = {
    getMySimulations: async () => apiClient.get('/simulation/me'),
    previewSimulation: async (body) => apiClient.post('/simulation/preview', body),
    createSimulation: async (body) => apiClient.post('/simulation', body),
    deleteSimulation: async (id) => apiClient.delete(`/simulation/${id}`)
};
