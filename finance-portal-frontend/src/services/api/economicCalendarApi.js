import { apiClient } from '../../config/apiClient';

/**
 * Tüm filtreler opsiyonel. params: { from?, to?, countries?, minImpact? }
 *   countries: "US,EU,TR" formatında virgülle ayrılmış (server bunu Set'e çevirir)
 *   minImpact: "LOW" | "MEDIUM" | "HIGH"
 */
export const economicCalendarApi = {
    getEvents: async (params = {}) => apiClient.get('/economic-calendar', { params })
};
