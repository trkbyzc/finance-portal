import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../config/apiClient';
import tokenManager from '../utils/tokenManager';
import authApi from '../services/api/authApi';

const AuthContext = createContext();

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const REALM = import.meta.env.VITE_KEYCLOAK_REALM;
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
const APP_URL = import.meta.env.VITE_APP_URL;
const REDIRECT_URI = `${APP_URL}/callback`;
const POST_LOGOUT_URI = `${APP_URL}/?logout=true`;

const TOKEN_REFRESH_THRESHOLD = 0.8;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshTimer, setRefreshTimer] = useState(null);

    useEffect(() => {
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete apiClient.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const forceLocalLogout = useCallback(() => {
        tokenManager.clearTokens();
        localStorage.removeItem('id_token');
        setToken(null);
        setUser(null);
    }, []);

    const refreshToken = useCallback(async () => {
        const storedRefreshToken = tokenManager.getRefreshToken();

        if (!storedRefreshToken) {
            console.warn('Refresh token bulunamadı');
            forceLocalLogout();
            return false;
        }

        try {
            console.warn('Token yenileniyor...');
            const response = await authApi.refreshAccessToken(storedRefreshToken);

            const tokenData = typeof response === 'string' ? JSON.parse(response) : response;

            tokenManager.setTokens(tokenData.access_token, tokenData.refresh_token);
            if (tokenData.id_token) {
                localStorage.setItem('id_token', tokenData.id_token);
            }

            setToken(tokenData.access_token);
            console.warn('Token başarıyla yenilendi');

            setupTokenRefresh(tokenData.access_token);

            return true;
        } catch (error) {
            console.error('Token yenileme hatası:', error);
            forceLocalLogout();
            return false;
        }
    }, [forceLocalLogout]);

    const setupTokenRefresh = useCallback((accessToken) => {
        if (refreshTimer) {
            clearTimeout(refreshTimer);
        }

        const expiresIn = tokenManager.getTokenExpiresIn(accessToken);

        if (expiresIn > 0) {
            const refreshTime = expiresIn * TOKEN_REFRESH_THRESHOLD * 1000;
            console.warn(`Token ${Math.round(refreshTime / 1000)} saniye sonra yenilenecek`);

            const timer = setTimeout(() => {
                refreshToken();
            }, refreshTime);

            setRefreshTimer(timer);
        }
    }, [refreshTimer, refreshToken]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('logout') === 'true') {
            console.warn('Keycloak üzerinden çıkış onaylandı, tamamen temizleniyor...');
            forceLocalLogout();

            window.history.replaceState({}, document.title, window.location.pathname);
            setLoading(false);
            return;
        }

        const storedToken = tokenManager.getAccessToken();

        if (storedToken) {
            console.warn('Kaydedilmiş token bulundu, doğrulanıyor...');

            if (tokenManager.isTokenExpired(storedToken)) {
                console.warn('Token süresi dolmuş, yenileniyor...');
                refreshToken().finally(() => setLoading(false));
            } else {
                validateToken(storedToken);
                setupTokenRefresh(storedToken);
            }
        } else {
            console.warn('Token bulunamadı, kullanıcı giriş yapmamış');
            setLoading(false);
        }

        return () => {
            if (refreshTimer) {
                clearTimeout(refreshTimer);
            }
        };
    }, []);

    const validateToken = async (tokenToValidate) => {
        try {
            const base64Url = tokenToValidate.split('.')[1];
            const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const tokenData = JSON.parse(jsonPayload);

            const currentTime = Math.floor(Date.now() / 1000);
            if (tokenData.exp && tokenData.exp < currentTime) {
                throw new Error("Token süresi dolmuş (Expired)");
            }

            console.warn('Token geçerli (JWT Decode), kullanıcı:', tokenData.preferred_username);

            const roles = tokenData.realm_access?.roles || [];
            const isAdmin = roles.includes('ADMIN');

            setToken(tokenToValidate);
            setUser({
                name: tokenData.name || tokenData.preferred_username,
                username: tokenData.preferred_username,
                email: tokenData.email,
                isAdmin: isAdmin
            });

        } catch (error) {
            console.warn('Token doğrulama (Decode) hatası:', error.message);
            forceLocalLogout();
        } finally {
            setLoading(false);
        }
    };

    const login = () => {
        const authUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid profile email`;
        console.warn('Keycloak login sayfasına yönlendiriliyor...');
        window.location.href = authUrl;
    };

    const register = () => {
        const registerUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/registrations?client_id=${CLIENT_ID}&response_type=code&scope=openid profile email&redirect_uri=${REDIRECT_URI}`;
        console.warn('Keycloak register sayfasına yönlendiriliyor...');
        window.location.href = registerUrl;
    };

    // JWT exp süresi dolmuş mu? (id_token_hint için taze olmalı)
    const isJwtExpired = (jwt) => {
        try {
            const payload = JSON.parse(atob(jwt.split('.')[1]));
            return !payload.exp || (payload.exp * 1000) <= Date.now();
        } catch {
            return true;
        }
    };

    const logout = async () => {
        console.warn('Çıkış yapılıyor, oturum tamamen kapatılıyor...');

        if (refreshTimer) {
            clearTimeout(refreshTimer);
            setRefreshTimer(null);
        }

        // id_token_hint geçiyoruz → Keycloak KENDİ çıkış onay ekranını ATLAR, doğrudan
        // session'ı kapatıp ?logout=true ile döner. Onayı uygulama içi pop-up'ta gösteriyoruz.
        //
        // ÖNEMLİ: id_token localStorage'da olmayabilir (sayfa açılışında refresh yapılmıyor,
        // access token JWT-decode ile doğrulanıyor) ya da süresi dolmuş olabilir. Keycloak
        // geçersiz/eksik hint'te kendi onay sayfasını gösterir. Bu yüzden çıkıştan hemen önce
        // refresh_token ile DOĞRUDAN taze bir id_token alıyoruz (refresh grant id_token döndürür).
        let idToken = localStorage.getItem('id_token');
        if (!idToken || isJwtExpired(idToken)) {
            try {
                const rt = tokenManager.getRefreshToken();
                if (rt) {
                    const data = await authApi.refreshAccessToken(rt);
                    if (data?.id_token) {
                        localStorage.setItem('id_token', data.id_token);
                        idToken = data.id_token;
                    }
                }
            } catch (e) {
                console.warn('Çıkış öncesi id_token tazeleme başarısız, hint olmadan devam:', e);
            }
        }

        // NOT: Token'ları burada SİLMİYORUZ. Temizlik ?logout=true ile dönüşte yapılır.
        let logoutUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout?client_id=${CLIENT_ID}&post_logout_redirect_uri=${encodeURIComponent(POST_LOGOUT_URI)}`;
        if (idToken) {
            logoutUrl += `&id_token_hint=${encodeURIComponent(idToken)}`;
        }

        window.location.href = logoutUrl;
    };

    const handleCallback = async (code) => {
        console.warn('Token alınıyor, code:', code.substring(0, 20) + '...');

        try {
            const response = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: CLIENT_ID,
                    code: code,
                    redirect_uri: REDIRECT_URI
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Token alma hatası:', errorData);
                throw new Error(errorData.error_description || 'Token alma başarısız');
            }

            const data = await response.json();
            console.warn('Token alındı');

            tokenManager.setTokens(data.access_token, data.refresh_token);
            if(data.id_token) {
                localStorage.setItem('id_token', data.id_token);
            }

            const userInfoResponse = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/userinfo`, {
                headers: { Authorization: `Bearer ${data.access_token}` }
            });

            if (!userInfoResponse.ok) {
                throw new Error('Kullanıcı bilgileri alınamadı');
            }

            const userData = await userInfoResponse.json();
            console.warn('Kullanıcı bilgileri alındı:', userData);

            setToken(data.access_token);
            setUser(userData);

            setupTokenRefresh(data.access_token);

            console.warn('Giriş başarılı, ana sayfaya yönlendiriliyor...');
            setTimeout(() => {
                window.location.href = '/';
            }, 500);

        } catch (error) {
            console.error('Giriş hatası:', error);
            alert('Giriş yapılırken hata oluştu: ' + error.message);
            forceLocalLogout();

            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            register,
            handleCallback,
            refreshToken,
            loading,
            isAuthenticated: !!user,
            isAdmin: user?.isAdmin || false
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};