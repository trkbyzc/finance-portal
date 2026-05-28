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

export const ASSET_COLOR = '#ff9800';
