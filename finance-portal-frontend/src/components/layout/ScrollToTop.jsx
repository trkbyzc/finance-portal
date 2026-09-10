import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route (pathname) değişiminde sayfayı en üste kaydırır.
 *
 * SPA'da React Router DOM'u değiştirir ama scroll pozisyonunu sıfırlamaz; bir sayfada aşağı
 * inip başka sayfaya geçince yeni sayfa önceki scroll'u miras alır. Bu component her pathname
 * değişiminde window'u başa atar (kaydırılan eleman container değil, window).
 *
 * Sadece pathname'e bakar — query string (?cat=...) değişiminde kaydırmaz, çünkü o tab/filtre
 * değişimidir ve sayfayı başa atmak istemeyiz. Görsel bir şey render etmez.
 */
export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        globalThis.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
