const CRYPTO_LIST = ['BTC', 'ETH', 'BNB', 'PEPE', 'SOL', 'USDT', 'XRP', 'ADA', 'DOT', 'DOGE'];

export const normalizeSymbol = (asset) => {
    // Türk altını (GRAM_ALTIN vb.): grafik stratejisi sembolün "_ALTIN" içermesine göre seçiliyor.
    // yahooSymbol (XAUTRY=X = ons-TRY) döndürürsek gram stratejisi devreye girmez — sembolü koru.
    if (isTurkishGold(asset?.symbol)) return asset.symbol;

    if (asset?.yahooSymbol) return asset.yahooSymbol;

    let sym = asset?.symbol || asset?.currencyCode || 'XU100.IS';

    if (CRYPTO_LIST.includes(sym) || asset?.assetCategory === 'CRYPTO') {
        if (!sym.includes('-USD') && !sym.includes('=X')) {
            return `${sym.replace('USDT', '')}-USD`;
        }
    }

    return sym;
};

export const getDisplayName = (asset, backendSymbol) => {
    return asset?.name ||
        asset?.currencyName ||
        backendSymbol.replace('.IS', '').replace('=X', '').replace('-USD', '');
};

export const isTurkishBond = (symbol) => symbol.startsWith('TP.');

// Semboller backend'de ASCII normalize (Locale.ROOT) olduğundan hem "ALTİN" hem "ALTIN" varyantı kontrol edilir.
export const isTurkishGold = (symbol) => {
    if (!symbol || typeof symbol !== 'string') return false;
    const s = symbol.toUpperCase();
    return s.includes('ALTIN') || s.includes('ALTİN') || s.includes('BILEZIK');
};

export const getChartType = (asset) => {
    if (asset?.chartType === 'LINE') return 'LINE';
    if (['BOND', 'FUND', 'EUROBOND'].includes(asset?.assetCategory)) return 'LINE';
    // Gram altın vb. → döviz gibi area (mum değil)
    if (isTurkishGold(asset?.symbol)) return 'LINE';
    if (asset?.chartType === 'NONE') return 'NONE';
    return 'CANDLE';
};