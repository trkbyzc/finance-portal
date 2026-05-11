/**
 * Projedeki tüm zamanlayıcılar, API limitleri ve genel ayarlar.
 * Tek bir yerden tüm sitenin yenilenme hızını ayarlayabilirsin!
 */
export const QUERY_CONFIG = {
    STALE_TIME: {
        SHORT: 30 * 1000,       // 30 Saniye (Çok hızlı değişen veriler, Ticker vs.)
        DEFAULT: 60 * 1000,     // 1 Dakika (Standart grafik ve piyasa verileri)
        LONG: 5 * 60 * 1000,    // 5 Dakika (Döviz kurları, haberler gibi yavaş değişenler)
    },
    REFETCH_INTERVAL: {
        TICKER: 30 * 1000,      // Ticker'ın kendi kendine dönme süresi
        LIVE_MARKET: 15 * 1000, // Canlı piyasa ekranı yenilenme hızı
    },
    LIMITS: {
        DASHBOARD_WIDGET: 6,    // Dashboard'daki listelerde kaç eleman gösterilecek
        NEWS_PAGE_SIZE: 10,     // Haberler sayfasında bir defada kaç haber çekilecek
    }
};