import axios from 'axios';
import tokenManager from '../utils/tokenManager';

let isBanAlertShown = false;

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = tokenManager.getAccessToken() || localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        // 🚀 BAN KONTROLÜ (403 Forbidden)
        if (error.response?.status === 403) {
            const errorMsgObj = error.response.data;
            const errorMsgStr = typeof errorMsgObj === 'string' ? errorMsgObj : JSON.stringify(errorMsgObj || {});
            const displayMsg = errorMsgObj?.error || errorMsgStr;

            if (errorMsgStr.toLowerCase().includes("askıya") || errorMsgStr.toLowerCase().includes("ban")) {
                if (!isBanAlertShown) {
                    isBanAlertShown = true;

                    tokenManager.clearTokens();
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');

                    const cleanMsg = typeof displayMsg === 'string' ? displayMsg.replace(/{"error":"|"}/g,"") : displayMsg;

                    // ALERT YERİNE KEYCLOAK'A YOLLAYARAK LOGOUT YAPTIR VE DASHBOARD'A PARAMETRE İLE DÖNDÜR
                    const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
                    const REALM = import.meta.env.VITE_KEYCLOAK_REALM;
                    const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

                    // Dashboard URL'sine "?banned=true&msg=..." dönmesini sağlıyoruz.
                    const returnURL = encodeURIComponent(`${window.location.origin}/?banned=true&msg=${encodeURIComponent(cleanMsg)}`);

                    window.location.href = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout?client_id=${CLIENT_ID}&post_logout_redirect_uri=${returnURL}`;
                }
                return Promise.reject(error);
            }
        }

        // Token geçersizse (401)
        if (error.response?.status === 401) {
            tokenManager.clearTokens();
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/';
        }

        console.error("API İstek Hatası:", error);
        return Promise.reject(error);
    }
);