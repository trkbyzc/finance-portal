/**
 * Projedeki tüm zamanlayıcılar, API limitleri ve genel ayarlar.
 */
export const QUERY_CONFIG = {
    STALE_TIME: {
        SHORT: 30 * 1000,       // 30 Saniye (Çok hızlı değişen veriler, Ticker vs.)
        DEFAULT: 60 * 1000,     // 1 Dakika (Standart grafik ve piyasa verileri)
        LONG: 5 * 60 * 1000,    // 5 Dakika (Döviz kurları, haberler gibi yavaş değişenler)
    },
    REFETCH_INTERVAL: {
        TICKER: 30 * 1000,
        LIVE_MARKET: 15 * 1000,
    },
    LIMITS: {
        DASHBOARD_WIDGET: 6,
        NEWS_PAGE_SIZE: 10,
    }
};