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
    // Türk altını (GRAM_ALTIN vb.): grafik stratejisi sembolün "_ALTIN" içermesine göre seçiliyor.
    // yahooSymbol (XAUTRY=X = ons-TRY) döndürürsek gram stratejisi devreye girmez — sembolü koru.
    if (isTurkishGold(asset?.symbol)) return asset.symbol;

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
 * Türk altını mı? (GRAM_ALTIN, CEYREK_ALTIN, 22_AYAR_BILEZIK ...)
 * Truncgil sembolleri ASCII normalize (Locale.ROOT) → "ALTIN"/"BILEZIK".
 * @param {string} symbol
 * @returns {boolean}
 */
export const isTurkishGold = (symbol) => {
    if (!symbol || typeof symbol !== 'string') return false;
    const s = symbol.toUpperCase();
    return s.includes('ALTIN') || s.includes('ALTİN') || s.includes('BILEZIK');
};

/**
 * Chart tipini belirle
 * @param {Object} asset - Asset objesi
 * @returns {string} Chart tipi (LINE, CANDLE, NONE)
 */
export const getChartType = (asset) => {
    if (asset?.chartType === 'LINE') return 'LINE';
    if (['BOND', 'FUND', 'EUROBOND'].includes(asset?.assetCategory)) return 'LINE';
    // Gram altın vb. → döviz gibi area (mum değil)
    if (isTurkishGold(asset?.symbol)) return 'LINE';
    if (asset?.chartType === 'NONE') return 'NONE';
    return 'CANDLE';
};