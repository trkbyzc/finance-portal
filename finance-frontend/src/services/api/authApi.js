import axios from 'axios';

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM;
const KEYCLOAK_BASE_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect`;
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
// URL'inize göre dinamik yönlendirme (SS'te auth/callback yazdığı için ona uyum sağlıyoruz)
const REDIRECT_URI = window.location.origin + window.location.pathname;

export const exchangeCodeForToken = async (code) => {
    try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', REDIRECT_URI);

        const response = await axios.post(`${KEYCLOAK_BASE_URL}/token`, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const refreshAccessToken = async (refreshToken) => {
    try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refreshToken);

        const response = await axios.post(`${KEYCLOAK_BASE_URL}/token`, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

const authApi = {
    exchangeCodeForToken,
    refreshAccessToken
};

export default authApi;