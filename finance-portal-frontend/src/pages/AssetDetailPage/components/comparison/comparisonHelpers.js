/**
 * Asset detail karşılaştırma section'unda kullanılan paylaşılan sabitler/helper'lar.
 * COLORS dizisinin index'i hem chip rengi hem recharts Line rengi olarak aynı kalmalı.
 */
export const COMPARISON_COLORS = ['#2962ff', '#f23645', '#089981', '#ff9800', '#9c27b0', '#e91e63'];

/**
 * Para birimine göre fiyat etiketini biçimle. Büyük sayılar için kısa format (M, B, K).
 * 1'in altında 4 hane, yukarısında 2 hane gösterir.
 */
export function formatPriceLabel(v, currency) {
    if (v == null || Number.isNaN(v)) return '';
    const symbol = currency === 'TRY' ? '₺' : '$';
    const abs = Math.abs(v);
    const locale = currency === 'TRY' ? 'tr-TR' : 'en-US';
    if (abs >= 1_000_000) return `${symbol}${(v / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${symbol}${(v / 1_000).toFixed(1)}K`;
    const digits = abs < 1 ? 4 : 2;
    return `${symbol}${Number(v).toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}
