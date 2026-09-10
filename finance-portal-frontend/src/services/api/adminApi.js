import { apiClient } from '../../config/apiClient';

// Admin işlemleri Keycloak Admin API'sine de değdiği için (kullanıcı listesi her satır
// için realmRoles çeker; kalıcı ban / oturum kapatma session sonlandırır) global 10sn
// timeout yetmeyip "İşlem başarısız" verebiliyordu → admin çağrılarına geniş süre tanıyoruz.
const ADMIN_TIMEOUT = 30000;

export const adminApi = {
    getUsers: async (params = {}) => {
        const search = new URLSearchParams();
        if (params.q) search.set('q', params.q);
        if (params.role) search.set('role', params.role);
        if (params.banned !== undefined && params.banned !== null) search.set('banned', String(params.banned));
        if (params.page !== undefined) search.set('page', String(params.page));
        if (params.size !== undefined) search.set('size', String(params.size));
        const qs = search.toString();
        return apiClient.get(`/admin/users${qs ? `?${qs}` : ''}`, { timeout: ADMIN_TIMEOUT });
    },
    banUser: async (userId, days) =>
        apiClient.post(`/admin/users/${userId}/ban?days=${days}`, null, { timeout: ADMIN_TIMEOUT }),
    banPermanent: async (userId) =>
        apiClient.post(`/admin/users/${userId}/ban-permanent`, null, { timeout: ADMIN_TIMEOUT }),
    unbanUser: async (userId) =>
        apiClient.post(`/admin/users/${userId}/unban`, null, { timeout: ADMIN_TIMEOUT }),
    logoutAll: async (userId) =>
        apiClient.post(`/admin/users/${userId}/logout-all`, null, { timeout: ADMIN_TIMEOUT }),
    deleteUser: async (userId) =>
        apiClient.delete(`/admin/users/${userId}`, { timeout: ADMIN_TIMEOUT })
};
