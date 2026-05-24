/**
 * 🔤 Symbol Utility Fonksiyonları
 * Asset sembollerini normalize etme ve dönüştürme
 */

const CRYPTO_LIST = ['BTC', 'ETH', 'BNB', 'PEPE', 'SOL', 'USDT', 'XRP', 'ADA', 'DOT', 'DOGE'];

/**
 * Asset'i backend için normalize et
 * @param {Object} asset - Asset objesi
 * @returns {string} Normalize edilmiş sembol
 */
export const normalizeSymbol = (asset) => {
    if (asset?.yahooSymbol) return asset.yahooSymbol;

    let sym = asset?.symbol || asset?.currencyCode || 'XU100.IS';

    // 🚀 HATA DÜZELTİLDİ: Sadece CRYPTO_LIST ve kategorisi CRYPTO olanları işle
    if (CRYPTO_LIST.includes(sym) || asset?.assetCategory === 'CRYPTO') {
        if (!sym.includes('-USD') && !sym.includes('=X')) {
            return `${sym.replace('USDT', '')}-USD`;
        }
    }

    return sym;
};

/**
 * Asset için görüntüleme adı al
 * @param {Object} asset - Asset objesi
 * @param {string} backendSymbol - Backend sembolü
 * @returns {string} Görüntüleme adı
 */
export const getDisplayName = (asset, backendSymbol) => {
    return asset?.name ||
        asset?.currencyName ||
        backendSymbol.replace('.IS', '').replace('=X', '').replace('-USD', '');
};

/**
 * Türk tahvili mi kontrol et
 * @param {string} symbol - Sembol
 * @returns {boolean} Türk tahvili mi?
 */
export const isTurkishBond = (symbol) => symbol.startsWith('TP.');

/**
 * Chart tipini belirle
 * @param {Object} asset - Asset objesi
 * @returns {string} Chart tipi (LINE, CANDLE, NONE)
 */
export const getChartType = (asset) => {
    if (asset?.chartType === 'LINE') return 'LINE';
    if (['BOND', 'FUND', 'EUROBOND'].includes(asset?.assetCategory)) return 'LINE';
    if (asset?.chartType === 'NONE') return 'NONE';
    return 'CANDLE';
};