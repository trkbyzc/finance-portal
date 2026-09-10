/**
 * PortfolioCharts (donut + bar) için paylaşılan paletler ve helper'lar.
 *
 * ASSET_COLORS: AssetType başına {base, light} pair'i — donut radial-gradient stop'ları için.
 * buildSymbolShades: tek-tip tab'da (groupBy='symbol') parent rengin 8 SOFT tonunu üretir.
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

/** Hex → HSL ({ h: 0-360, s/l: 0-100 }). */
function hexToHsl(hex) {
    const h = hex.replace('#', '');
    const r = Number.parseInt(h.substring(0, 2), 16) / 255;
    const g = Number.parseInt(h.substring(2, 4), 16) / 255;
    const b = Number.parseInt(h.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let hue = 0, sat = 0;
    if (max !== min) {
        const d = max - min;
        sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) hue = (b - r) / d + 2;
        else hue = (r - g) / d + 4;
        hue *= 60;
    }
    return { h: hue, s: sat * 100, l: l * 100 };
}

/** HSL → hex (#rrggbb). */
function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
        const c = l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
        return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Tek-sembol dağılımı için parent renginin 8 SOFT tonu.
 * İlk ton girdinin AYNISIDIR (kategori ana rengiyle görsel bağ — ör. VİOP = cyan).
 * Kalan 7 ton aynı renk ailesinde: hue hafif döner, lightness orta-açık bandda (50-72) tutulur —
 * böylece koyulaşıp SİYAHA kaçan tonlar oluşmaz, hepsi yumuşak/okunaklı kalır.
 */
export const buildSymbolShades = (base) => {
    const { h, s, l } = hexToHsl(base);
    const sat = Math.max(46, Math.min(66, s)); // çok cıvık/çok dolu olmasın
    const variants = [
        { dh: 22, l: 64 }, { dh: -20, l: 56 }, { dh: 42, l: 69 },
        { dh: -38, l: 52 }, { dh: 60, l: 72 }, { dh: -54, l: 50 }, { dh: 14, l: 60 }
    ];
    const shades = [{ base, light: hslToHex(h, Math.min(72, sat + 8), Math.min(82, l + 14)) }];
    variants.forEach(({ dh, l: ll }) => {
        const hu = (h + dh + 360) % 360;
        shades.push({ base: hslToHex(hu, sat, ll), light: hslToHex(hu, Math.min(72, sat + 6), Math.min(84, ll + 12)) });
    });
    return shades;
};

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
