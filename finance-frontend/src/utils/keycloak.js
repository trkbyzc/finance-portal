/**
 * Keycloak login/register yönlendirmeleri — tek merkez.
 *
 * Navbar ve Dashboard bu fonksiyonları kullanır; URL/realm/client tek yerden yönetilir.
 * Dashboard'daki "Hesap Oluştur" butonu eskiden navigate('/register') çağırıyordu ama
 * öyle bir route olmadığı için boş sayfa dönüyordu — artık doğrudan Keycloak'a gider.
 */
const KC_BASE = 'http://localhost:8080/realms/finance-realm/protocol/openid-connect';
const REDIRECT_URI = 'http://localhost:5173/auth/callback';
const COMMON_PARAMS = `client_id=finance-client&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid`;

export const goToRegister = () => {
    window.location.href = `${KC_BASE}/registrations?${COMMON_PARAMS}`;
};

export const goToLogin = () => {
    window.location.href = `${KC_BASE}/auth?${COMMON_PARAMS}`;
};
