/**
 * Projedeki tüm harici medya, ikon ve CDN linklerinin merkezi yönetim dosyası.
 * Yarın bir gün CDN patlarsa SADECE BURAYI değiştireceksin.
 */
export const ASSET_CDNS = {
    CRYPTO_ICONS: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/32/color',
    // İkincil kaynak: atomiclabs setinde olmayan (daha yeni/uzun kuyruk) coinler için.
    CRYPTO_ICONS_FALLBACK: 'https://assets.coincap.io/assets/icons',
    FLAGS: 'https://flagcdn.com/48x36'
};

/**
 * Ülke bayrakları için özel dönüşüm haritası.
 */
export const FLAG_MAPPINGS = {
    'EUR': 'eu', 'GBP': 'gb', 'JPY': 'jp', 'CHF': 'ch',
    'USD': 'us', 'AUD': 'au', 'CAD': 'ca', 'TRY': 'tr',
};

/**
 * Kripto paraların sonundaki fiat/sabit para birimlerini temizlemek için Regex.
 */
export const FIAT_PAIRS_REGEX = /USDT|TRY|USD/g;