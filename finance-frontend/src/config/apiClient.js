import axios from 'axios';
import tokenManager from '../utils/tokenManager';

let isBanAlertShown = false;

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1',
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
        // Ban kontrolü (403): Keycloak SPI banlı kullanıcıyı 2FA öncesi durdurur.
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
                    localStorage.removeItem('id_token');

                    // Ban detayını sakla → Dashboard pop-up'ı gün/bitiş tarihiyle gösterir.
                    // (Önceki Keycloak logout round-trip'i kaldırıldı: id_token_hint olmadan
                    //  onay ekranı çıkıp mesaj kaybolabiliyordu. Aynı origin'e dönmek güvenilir.)
                    // daysLeft burada (saf JS) hesaplanır; React render'ında Date.now() çağrılmasın diye.
                    let daysLeft = null;
                    if (errorMsgObj?.until) {
                        const diffMs = new Date(errorMsgObj.until).getTime() - Date.now();
                        daysLeft = Math.max(0, Math.ceil(diffMs / 86400000));
                    }
                    try {
                        sessionStorage.setItem('ban_info', JSON.stringify({
                            message: typeof displayMsg === 'string' ? displayMsg : '',
                            banType: errorMsgObj?.banType || null,
                            until: errorMsgObj?.until || null,
                            daysLeft
                        }));
                    } catch { /* sessionStorage yoksa yoksay */ }

                    window.location.href = '/?banned=true';
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