/**
 * Varlık DOĞASI — portföy tablosunu/sekmeleri ortak çatı altında kümeler.
 *
 * Üç doğa, çünkü değerleme/kotasyon mantıkları temelden farklı:
 *   - SPOT   : hisse, döviz, emtia, kripto, fon — fiyat-bazlı (Ort. Maliyet / Anlık Fiyat).
 *   - FIXED  : tahvil, bono, eurobond — GETİRİ-bazlı (Giriş Getirisi / Güncel Getiri).
 *   - DERIV  : VİOP (vadeli/türev) — kaldıraçlı, teminat-bazlı (Yön / Kaldıraç).
 */

export const NATURE_ORDER = ['SPOT', 'FIXED', 'DERIV'];

export function assetNature(assetType) {
    if (assetType === 'BOND') return 'FIXED';
    if (assetType === 'FUTURE') return 'DERIV';
    return 'SPOT';
}

/** Getiri-bazlı (tahvil) mı — fiyat sütunu yerine getiri gösterilir, K/Z grafiği anlamsızdır. */
export function isYieldBased(assetType) {
    return assetType === 'BOND';
}

/** Sabit getiri (tahvil) KATEGORİLERİ — ekleme/al-sat formlarında fiyat değil getiri/temiz fiyat istenir. */
export const YIELD_CATEGORIES = new Set(['BOND', 'TR_BOND', 'EUROBOND']);

export function isYieldCategory(cat) {
    return YIELD_CATEGORIES.has(String(cat || '').toUpperCase());
}

/**
 * Tahvil ekleme/işlem formlarında fiyat alanı etiketi:
 *   - EUROBOND → "Temiz Fiyat (%)" (temiz fiyat saklanır)
 *   - diğer tahvil (DİBS/global) → "Getiri (%)" (giriş getirisi saklanır)
 *   - tahvil değilse → null (çağıran genel "Alış Fiyatı" etiketini kullanır)
 */
export function yieldFieldLabelKey(cat) {
    const c = String(cat || '').toUpperCase();
    if (c === 'EUROBOND') return 'cleanPrice';
    if (YIELD_CATEGORIES.has(c)) return 'yield';
    return null;
}
