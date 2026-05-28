import React from 'react';
import { useLocation } from 'react-router-dom';
import MarketTicker from './MarketTicker';
import useUserPreferences from '../../../hooks/useUserPreferences';

/**
 * Ticker bar'ı sayfa-bazlı koşullu render eder. Karar matrisi:
 *
 *   Guest (auth değil):           sadece Dashboard'da (/)
 *   Auth + scope=HOME_ONLY:       sadece Dashboard'da (/)
 *   Auth + scope=ALL_PAGES (def): her sayfada
 *
 * Loading state'de (prefs henüz gelmedi): ALL_PAGES default'una göre davranır,
 * böylece auth user'a 1-2 saniyelik flicker yerine direkt ticker görünür.
 */
export default function GlobalTicker() {
    const { pathname } = useLocation();
    const { preferences } = useUserPreferences();

    const isHome = pathname === '/';
    const scope = preferences?.tickerScope || 'ALL_PAGES';

    // Authenticated değilse preferences null gelir — sadece home'da göster
    if (!preferences) {
        return isHome ? <MarketTicker /> : null;
    }

    if (scope === 'HOME_ONLY' && !isHome) return null;
    return <MarketTicker />;
}
