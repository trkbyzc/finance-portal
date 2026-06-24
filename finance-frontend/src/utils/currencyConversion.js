/**
 * Bir varlığın doğal (native) para birimini tespit eder ve "yield bazlı" olup olmadığını ayırt eder.
 * AssetHeader ve TradingChart bu helper'ları kullanarak TRY/USD toggle davranışını belirler.
 */

export const detectNativeCurrency = (asset) => {
    if (!asset) return 'USD';
    const sym = (asset.symbol || asset.yahooSymbol || '').toUpperCase();
    const cat = (asset.assetCategory || '').toUpperCase();

    if (sym.endsWith('.IS')) return 'TRY';
    if (cat === 'TR_BOND') return 'TRY';
    if (cat === 'TR_FUND') return 'TRY';

    // Türk altını (GRAM_ALTIN vb.) TRY bazlı fiyatlanır; USD toggle güncel kurla böler.
    if (sym.includes('ALTIN') || sym.includes('ALTİN') || sym.includes('BILEZIK')) return 'TRY';

    // VIOP — BIST'te işlem gören kontratlar TRY denominated (F_XU030, F_USDTRY, BİST 30 Vadeli, vb.)
    if (cat === 'VIOP') return 'TRY';

    if (cat === 'INDEX' && (sym.startsWith('X') || sym.endsWith('.IS'))) return 'TRY';

    // Currency pair'ler — pair'in quote currency'si dikkate alınır
    // USDTRY=X, EURTRY=X → TRY denominated
    // EURUSD=X, GBPUSD=X → USD denominated
    if (sym.endsWith('TRY=X')) return 'TRY';
    if (sym.endsWith('=X')) return 'USD';

    if (asset.currencyCode === 'TRY') return 'TRY';

    // Kripto, emtia, ABD hisse, EMB, küresel fon, global bond → USD
    return 'USD';
};

/**
 * Type key + sembolden native currency çıkarır. Asset detail'inden değil, picker / portfolio satırı gibi
 * sadece type-key (backend enum veya UI 8-type) ve sembolün elimizde olduğu yerlerde kullanılır.
 *
 *   STOCK            → sembol .IS ile bitiyorsa TRY, aksi USD (yabancı hisse)
 *   CRYPTO/COMMODITY → USD (CoinGecko + Yahoo futures USD bazlı)
 *   BOND             → USD (Yahoo Treasury yields)
 *   CURRENCY/GOLD/BOND_TR/FUND/TR_BOND/TR_FUND → TRY
 *
 * @param {string} typeKey  AssetType enum veya UI uiKey ('STOCK', 'CRYPTO', 'GOLD', 'BOND_TR', ...)
 * @param {string} [symbol] sembol; sadece STOCK için anlamlı
 * @returns {'TRY' | 'USD'}
 */
export const nativeCurrencyForType = (typeKey, symbol) => {
    const sym = (symbol || '').toUpperCase();
    switch ((typeKey || '').toUpperCase()) {
        case 'STOCK':
            return sym.endsWith('.IS') ? 'TRY' : 'USD';
        case 'COMMODITY':
            // Türk altını/gümüşü (GRAM_ALTIN, CEYREK_ALTIN, BILEZIK…) TRY bazlı; küresel emtia (GC=F, CL=F) USD.
            return (sym.includes('ALTIN') || sym.includes('ALTİN') || sym.includes('GUMUS')
                || sym.includes('GÜMÜŞ') || sym.includes('BILEZIK')) ? 'TRY' : 'USD';
        case 'CRYPTO':
        case 'BOND':
        case 'EUROBOND':
            return 'USD';
        default:
            // CURRENCY, GOLD, BOND_TR, FUND, TR_BOND, TR_FUND → TRY (TR bazlı veya forexSelling = TRY karşılığı)
            return 'TRY';
    }
};

/**
 * Varlık "yield bazlı" mı? (% getiri tahvili). Bu durumda TRY/USD conversion anlamsız.
 * @param {Object} asset
 * @returns {boolean}
 */
export const isYieldAsset = (asset) => {
    if (!asset) return false;
    const cat = (asset.assetCategory || '').toUpperCase();
    const sym = (asset.symbol || asset.yahooSymbol || '').toUpperCase();

    // TR Tahvil — TP. prefix'li EVDS yield serisi
    if (cat === 'TR_BOND' || sym.startsWith('TP.')) return true;

    // Küresel tahvil yield'leri (Yahoo ^IRX, ^FVX, ^TNX, ^TYX)
    if (cat === 'BOND' && sym.startsWith('^')) return true;

    return false;
};
