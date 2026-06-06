/**
 * Keycloak login/register yönlendirmeleri — tek merkez.
 *
 * Navbar ve Dashboard bu fonksiyonları kullanır; URL/realm/client tek yerden yönetilir.
 * Dashboard'daki "Hesap Oluştur" butonu eskiden navigate('/register') çağırıyordu ama
 * öyle bir route olmadığı için boş sayfa dönüyordu — artık doğrudan Keycloak'a gider.
 *
 * URL'ler Vite env'den gelir; bulunmazsa window.location.origin fallback (cloud-safe).
 */
const KC_URL = import.meta.env.VITE_KEYCLOAK_URL || `${window.location.origin}/auth`;
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'finance-realm';
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'finance-client';
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

const KC_BASE = `${KC_URL}/realms/${REALM}/protocol/openid-connect`;
const REDIRECT_URI = `${APP_URL}/auth/callback`;
const COMMON_PARAMS = `client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=openid`;

export const goToRegister = () => {
    window.location.href = `${KC_BASE}/registrations?${COMMON_PARAMS}`;
};

export const goToLogin = () => {
    window.location.href = `${KC_BASE}/auth?${COMMON_PARAMS}`;
};
