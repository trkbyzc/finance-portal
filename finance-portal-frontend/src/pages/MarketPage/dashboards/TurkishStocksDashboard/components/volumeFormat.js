/**
 * Hacim/işlem tutarını kompakt biçimde göster: 1.2B, 950M, 650K.
 * Türk locale (tr-TR) kullanır — desimal ayracı virgül.
 */
export function formatCompactVolume(val) {
    const n = Number(val ?? 0);
    if (!Number.isFinite(n) || n <= 0) return '-';
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.', ',')}B`;
    if (abs >= 1_000_000)     return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
    if (abs >= 1_000)         return `${(n / 1_000).toFixed(1).replace('.', ',')}K`;
    return n.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
}
