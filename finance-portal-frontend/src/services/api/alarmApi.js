import { apiClient } from '../../config/apiClient';

/**
 * Fiyat alarmı endpoint'leri.
 * Backend: /api/alarms
 */
export const alarmApi = {
    listMine: () => apiClient.get('/alarms'),
    create: (payload) => apiClient.post('/alarms', payload),
    setActive: (id, active) => apiClient.put(`/alarms/${id}/active`, null, { params: { active } }),
    remove: (id) => apiClient.delete(`/alarms/${id}`)
};
