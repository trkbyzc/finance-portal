/**
 * PortfolioCharts (donut + bar) için paylaşılan paletler ve helper'lar.
 *
 * ASSET_COLORS: AssetType başına {base, light} pair'i — donut radial-gradient stop'ları için.
 * buildSymbolShades: tek-tip tab'da (groupBy='symbol') parent rengin 8 tonunu üretir.
 */

export const ASSET_COLORS = {
    STOCK:     { base: '#3b82f6', light: '#60a5fa' },
    CRYPTO:    { base: '#f59e0b', light: '#fbbf24' },
    CURRENCY:  { base: '#10b981', light: '#34d399' },
    COMMODITY: { base: '#eab308', light: '#facc15' },
    BOND:      { base: '#8b5cf6', light: '#a78bfa' },
    FUND:      { base: '#ec4899', light: '#f472b6' },
    FUTURE:    { base: '#06b6d4', light: '#22d3ee' }
};

export const DEFAULT_COLOR = { base: '#64748b', light: '#94a3b8' };

/** Hex → RGB → factor uygulanır → hex (factor < 1 koyulaştır, > 1 açıklaştır). */
function shade(hex, factor) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const adjust = (c) => Math.max(0, Math.min(255, Math.round(c * factor)));
    return `#${[adjust(r), adjust(g), adjust(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

export const buildSymbolShades = (base) => [
    { base, light: base },
    { base: shade(base, 0.85), light: shade(base, 1.15) },
    { base: shade(base, 1.15), light: shade(base, 1.4) },
    { base: shade(base, 0.7), light: shade(base, 0.95) },
    { base: shade(base, 1.3), light: shade(base, 1.5) },
    { base: shade(base, 0.55), light: shade(base, 0.85) },
    { base: shade(base, 1.45), light: shade(base, 1.65) },
    { base: shade(base, 0.4), light: shade(base, 0.7) }
];

export const fmtTry = (v) =>
    Number(v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const tooltipStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    color: 'var(--color-text)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    padding: '10px 12px'
};
