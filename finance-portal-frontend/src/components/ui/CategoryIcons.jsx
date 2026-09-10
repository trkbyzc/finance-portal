import React from 'react';

/**
 * Dashboard kategori sekmeleri için yumuşak, dolu (duotone) custom ikonlar.
 * Monokrom: currentColor + opaklık ile iki ton → aktif sekmede primary, pasifte muted rengini alır
 * (sistem renklerine sadık, ekstra renk yok). Boyut `size` prop'uyla verilir.
 */

const wrap = (size, children) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {children}
    </svg>
);

/** Hisseler — yükselen yumuşak çubuk grafik. */
export function StocksIcon({ size = 16 }) {
    return wrap(size, (
        <>
            <rect x="3" y="13" width="4.5" height="8" rx="2.2" fill="currentColor" opacity="0.4" />
            <rect x="9.75" y="8" width="4.5" height="13" rx="2.2" fill="currentColor" opacity="0.65" />
            <rect x="16.5" y="4" width="4.5" height="17" rx="2.2" fill="currentColor" />
        </>
    ));
}

/** Dövizler — yumuşak banknot + merkezde para. */
export function CurrencyIcon({ size = 16 }) {
    return wrap(size, (
        <>
            <rect x="2" y="5.5" width="20" height="13" rx="3.5" fill="currentColor" opacity="0.4" />
            <circle cx="12" cy="12" r="3.1" fill="currentColor" />
        </>
    ));
}

/** Emtialar — istiflenmiş yumuşak külçeler. */
export function CommodityIcon({ size = 16 }) {
    return wrap(size, (
        <>
            <rect x="3.5" y="13.3" width="17" height="5.7" rx="2.1" fill="currentColor" />
            <rect x="7" y="6.4" width="10" height="5.7" rx="2.1" fill="currentColor" opacity="0.45" />
        </>
    ));
}

/** Kripto — yumuşak para üstünde ₿ işareti. */
export function CryptoIcon({ size = 16 }) {
    return wrap(size, (
        <>
            <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.35" />
            <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M10 8 v8" />
                <path d="M10 8 h3.4 a2 2 0 0 1 0 4 H10" />
                <path d="M10 12 h3.8 a2 2 0 0 1 0 4 H10" />
                <path d="M11.6 6.6 v1.4 M13.2 6.6 v1.4 M11.6 16 v1.4 M13.2 16 v1.4" />
            </g>
        </>
    ));
}

/** Haberler — yumuşak doküman + metin satırları. */
export function NewsIcon({ size = 16 }) {
    return wrap(size, (
        <>
            <rect x="4" y="4" width="16" height="16" rx="3.5" fill="currentColor" opacity="0.4" />
            <rect x="7" y="8" width="10" height="1.8" rx="0.9" fill="currentColor" />
            <rect x="7" y="11.6" width="10" height="1.8" rx="0.9" fill="currentColor" opacity="0.85" />
            <rect x="7" y="15.2" width="6" height="1.8" rx="0.9" fill="currentColor" opacity="0.85" />
        </>
    ));
}
