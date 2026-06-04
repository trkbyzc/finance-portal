/**
 * TradingChart için benchmark overlay sabitleri.
 *
 * BIST_OPTIONS: TR hisseleri için BIST endeksleri (XU100/50/30) — Fintables üzerinden.
 *   Yahoo XU050 vermediği için category='TR_INDEX' ile BistIndexChartStrategy'e yönlendirilir.
 * CRYPTO_OPTIONS: Kriptolar için BITW (Bitwise 10 Crypto Index Fund) — BIST 30'un kripto karşılığı.
 *   Yahoo'daki gerçek kripto endeksleri (^CMC200/100/500) 2024-08'de delisted oldu.
 */

export const BIST_OPTIONS = [
    { key: 'XU100', symbol: 'XU100', label: 'BIST 100', color: '#2962ff', category: 'TR_INDEX' },
    { key: 'XU050', symbol: 'XU050', label: 'BIST 50',  color: '#089981', category: 'TR_INDEX' },
    { key: 'XU030', symbol: 'XU030', label: 'BIST 30',  color: '#f23645', category: 'TR_INDEX' }
];

export const CRYPTO_OPTIONS = [
    { key: 'BITW', symbol: 'BITW', label: 'BITW (Top 10)', color: '#9c27b0', category: 'INDEX' }
];

/**
 * Hisse sektörüne göre eklenen BIST sektör endeksi (BIST KARŞILAŞTIR'a XU100/50/30'a EK olarak).
 * Kapsam bilinçli olarak XBANK/XUSIN ile sınırlı: banka ise BIST Bankacılık, değilse BIST Sınai.
 * TR_INDEX kategorisiyle aynı Fintables UDF endpoint'inden çekilir (XU100 ile aynı aile).
 */
export const SECTOR_INDEXES = {
    XBANK: { key: 'XBANK', symbol: 'XBANK', label: 'BIST Bankacılık', color: '#e0a800', category: 'TR_INDEX' },
    XUSIN: { key: 'XUSIN', symbol: 'XUSIN', label: 'BIST Sınai',       color: '#e0a800', category: 'TR_INDEX' }
};

/** İş Yatırım sektör adından ilgili BIST sektör endeksini seç; sektör yoksa null (buton eklenmez). */
export function sectorIndexFor(sector) {
    if (!sector) return null;
    const s = sector.toLocaleLowerCase('tr');
    if (s.includes('banka')) return SECTOR_INDEXES.XBANK;
    return SECTOR_INDEXES.XUSIN;
}

export const ASSET_COLOR = '#ff9800';
