import { apiClient } from '../../config/apiClient';

/**
 * Kaydedilmiş grafikler (çizim araçları + ayarlar). Backend: /api/charts.
 * payload, overlay listesi + grafik durumunu içeren JSON string'tir.
 */
export const savedChartApi = {
    getMyCharts: async () => apiClient.get('/charts/me'),
    getChart: async (id) => apiClient.get(`/charts/${id}`),
    createChart: async ({ symbol, assetCategory, name, payload }) =>
        apiClient.post('/charts', { symbol, assetCategory, name, payload }),
    updateChart: async (id, { name, assetCategory, payload }) =>
        apiClient.put(`/charts/${id}`, { name, assetCategory, payload }),
    deleteChart: async (id) => apiClient.delete(`/charts/${id}`),
};
