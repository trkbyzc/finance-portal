import { useLocation } from 'react-router-dom';
import MarketTicker from './MarketTicker';
import useUserPreferences from '../../../hooks/useUserPreferences';

/**
 * Ticker bar'ı sayfa-bazlı koşullu render eder. Karar matrisi:
 *
 *   Guest (auth değil):           sadece Dashboard'da (/)
 *   Auth + scope=HOME_ONLY (def): sadece Dashboard'da (/)
 *   Auth + scope=ALL_PAGES:       her sayfada
 *
 * Default HOME_ONLY — kullanıcı /preferences'tan açıkça ALL_PAGES seçmeden ticker
 * sadece ana sayfada görünür (eski global davranıştan daha sessiz, daha az gürültü).
 */
export default function GlobalTicker() {
    const { pathname } = useLocation();
    const { preferences } = useUserPreferences();

    const isHome = pathname === '/';
    const scope = preferences?.tickerScope || 'HOME_ONLY';

    // Authenticated değilse preferences null gelir — sadece home'da göster
    if (!preferences) {
        return isHome ? <MarketTicker /> : null;
    }

    if (scope === 'HOME_ONLY' && !isHome) return null;
    return <MarketTicker />;
}
