/**
 * Token Manager Utility
 * LocalStorage'da token yönetimi için yardımcı fonksiyonlar
 */

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenManager = {
    /**
     * Access token'ı localStorage'a kaydet
     */
    setAccessToken: (token) => {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        }
    },

    /**
 * Access token'ı al (localStorage veya sessionStorage'dan)
 */
getAccessToken: () => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
},

    /**
     * Refresh token'ı localStorage'a kaydet
     */
    setRefreshToken: (token) => {
        if (token) {
            localStorage.setItem(REFRESH_TOKEN_KEY, token);
        }
    },

    /**
 * Refresh token'ı al (localStorage veya sessionStorage'dan)
 */
getRefreshToken: () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
},

    /**
     * Her iki token'ı da kaydet
     */
    setTokens: (accessToken, refreshToken) => {
        tokenManager.setAccessToken(accessToken);
        tokenManager.setRefreshToken(refreshToken);
    },

    /**
 * Her iki token'ı da temizle (localStorage ve sessionStorage)
 */
clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
},

    /**
     * Token var mı kontrol et
     */
    hasToken: () => {
        return !!tokenManager.getAccessToken();
    },

    /**
     * JWT token'ı decode et (payload'ı al)
     */
    decodeToken: (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Token decode hatası:', error);
            return null;
        }
    },

    /**
     * Token'ın süresi dolmuş mu kontrol et
     */
    isTokenExpired: (token) => {
        const decoded = tokenManager.decodeToken(token);
        if (!decoded || !decoded.exp) {
            return true;
        }
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    },

    /**
     * Token'ın süresinin dolmasına ne kadar kaldı (saniye)
     */
    getTokenExpiresIn: (token) => {
        const decoded = tokenManager.decodeToken(token);
        if (!decoded || !decoded.exp) {
            return 0;
        }
        const currentTime = Date.now() / 1000;
        return Math.max(0, decoded.exp - currentTime);
    }
};

export default tokenManager;
