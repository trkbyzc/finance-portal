const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenManager = {
    setAccessToken: (token) => {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        }
    },

    getAccessToken: () => {
        // Keycloak silent-refresh sonrası token sessionStorage'a da yazılabilir; her ikisi kontrol edilir.
        return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    },

    setRefreshToken: (token) => {
        if (token) {
            localStorage.setItem(REFRESH_TOKEN_KEY, token);
        }
    },

    getRefreshToken: () => {
        return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
    },

    setTokens: (accessToken, refreshToken) => {
        tokenManager.setAccessToken(accessToken);
        tokenManager.setRefreshToken(refreshToken);
    },

    clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
},

    hasToken: () => {
        return !!tokenManager.getAccessToken();
    },

    decodeToken: (token) => {
        try {
            // JWT, URL-safe base64 (RFC 4648 §5) kullanır; atob() standart base64 beklediği için +/_ dönüşümü gerekir.
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
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

    isTokenExpired: (token) => {
        const decoded = tokenManager.decodeToken(token);
        if (!decoded || !decoded.exp) {
            return true;
        }
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    },

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
