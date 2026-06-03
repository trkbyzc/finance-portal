import { apiClient } from '../../config/apiClient';

/**
 * Kullanıcı (profil + 2FA) endpoint'leri.
 * 2FA durumu Keycloak'ta tutulur; backend ince proxy görevi görür.
 */
export const userApi = {
    getMyProfile: () => apiClient.get('/users/me'),

    // 2FA
    get2FAStatus: () => apiClient.get('/users/me/2fa'),
    set2FA: (enabled) => apiClient.put('/users/me/2fa', null, { params: { enabled } }),

    // E-posta bildirimleri
    getEmailNotifications: () => apiClient.get('/users/me/email-notifications'),
    setEmailNotifications: (enabled) => apiClient.put('/users/me/email-notifications', null, { params: { enabled } })
};
