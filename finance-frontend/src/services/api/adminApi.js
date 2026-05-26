import { apiClient } from '../../config/apiClient';

export const adminApi = {
    getUsers: async (params = {}) => {
        const search = new URLSearchParams();
        if (params.q) search.set('q', params.q);
        if (params.role) search.set('role', params.role);
        if (params.banned !== undefined && params.banned !== null) search.set('banned', String(params.banned));
        if (params.page !== undefined) search.set('page', String(params.page));
        if (params.size !== undefined) search.set('size', String(params.size));
        const qs = search.toString();
        return apiClient.get(`/admin/users${qs ? `?${qs}` : ''}`);
    },
    banUser: async (userId, days) =>
        apiClient.post(`/admin/users/${userId}/ban?days=${days}`),
    banPermanent: async (userId) =>
        apiClient.post(`/admin/users/${userId}/ban-permanent`),
    unbanUser: async (userId) =>
        apiClient.post(`/admin/users/${userId}/unban`),
    logoutAll: async (userId) =>
        apiClient.post(`/admin/users/${userId}/logout-all`),
    deleteUser: async (userId) =>
        apiClient.delete(`/admin/users/${userId}`)
};
