/**
 * Projedeki tüm harici medya, ikon ve CDN linklerinin merkezi yönetim dosyası.
 * Yarın bir gün CDN patlarsa SADECE BURAYI değiştireceksin.
 */
export const ASSET_CDNS = {
    // Kripto ikonları artık CoinGecko'dan (coin.image) geliyor — CDN tahminine gerek yok.
    FLAGS: 'https://flagcdn.com/48x36'
};

/**
 * Ülke bayrakları için özel dönüşüm haritası.
 */
export const FLAG_MAPPINGS = {
    'EUR': 'eu', 'GBP': 'gb', 'JPY': 'jp', 'CHF': 'ch',
    'USD': 'us', 'AUD': 'au', 'CAD': 'ca', 'TRY': 'tr',
};