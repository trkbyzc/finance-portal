/**
 * Sembol -> Kategori belirsizliğini çözen utility'ler.
 *
 * Problem: Aynı sembol (örn. "THYAO.IS") birden çok listede (STOCK + VIOP) görünüyor;
 * useAssetDetails Object.values ile sırasız arama yaptığı için yanlış kategoriyi seçebiliyordu.
 *
 * Çözüm:
 *   1) URL'de ?cat=... varsa primary source (kesin)
 *   2) Yoksa sembol pattern'ından kategori çıkar (.IS, =X, -USD, =F, _, TP.)
 *   3) Hâlâ belirsizse null → fallback global search
 */

// NOT: Backend (MarketDataController) bu key'leri kullanır — frontend olarak aynısını okumalı.
//   cryptos (crypto değil), global_bonds (bonds değil), tr_bonds, eurobonds, vs.
const CATEGORY_TO_MARKETS_KEY = {
    STOCK: 'stocks',
    CRYPTO: 'cryptos',
    CURRENCY: 'currencies',
    BOND: 'global_bonds',
    EUROBOND: 'eurobonds',
    TR_BOND: 'tr_bonds',
    VIOP: 'viop',
    FUND: 'global_funds',
    TR_FUND: 'tr_funds',
    COMMODITY: 'commodities',
    INDEX: 'indices'
};

/**
 * Sembol formatından kategori tahmin et. Net pattern yoksa null döner.
 * @param {string} symbol
 * @returns {string|null} STOCK | CRYPTO | CURRENCY | BOND | VIOP | COMMODITY | TR_BOND | INDEX | null
 */
export const detectCategoryFromSymbol = (symbol) => {
    if (!symbol || typeof symbol !== 'string') return null;
    const s = symbol.trim().toUpperCase();
    if (!s) return null;

    // TR tahvili — backend "TP." prefix'iyle döner
    if (s.startsWith('TP.')) return 'TR_BOND';

    // TR Eurobond — backend "TR10Y_EUROBOND" gibi özel sembol
    if (s.endsWith('_EUROBOND') || s === 'TR10Y_EUROBOND') return 'EUROBOND';

    // BIST endeksleri — XU100, XU050, XU030, XBANK, XUSIN...
    if (/^X[A-Z0-9]{3,5}(\.IS)?$/.test(s)) return 'INDEX';

    // BIST hisseleri ".IS" suffix'iyle
    if (s.endsWith('.IS')) return 'STOCK';

    // VIOP — Borsa kalıbı F_XXXXX_YY veya "VADE" / "VADELI" geçenler
    if (s.startsWith('F_') || s.includes('_VADE') || s.includes('VADELI')) return 'VIOP';

    // Forex Yahoo formatı (USDTRY=X, EURUSD=X)
    if (s.endsWith('=X')) return 'CURRENCY';

    // Futures (emtia) Yahoo formatı (GC=F, SI=F, CL=F)
    if (s.endsWith('=F')) return 'COMMODITY';

    // Kripto Yahoo formatı (BTC-USD, ETH-USD)
    if (s.endsWith('-USD') || s.endsWith('USDT')) return 'CRYPTO';

    return null;
};

/**
 * Kategori adı -> allMarketsData içindeki ilgili array key'i.
 * Tek key dönenler için string, birden fazla key birleştirilecekse array döner.
 */
export const marketsKeyForCategory = (category) => {
    if (!category) return null;
    const c = category.toUpperCase();
    if (c === 'FUND') return ['global_funds', 'tr_funds'];
    return CATEGORY_TO_MARKETS_KEY[c] || null;
};
