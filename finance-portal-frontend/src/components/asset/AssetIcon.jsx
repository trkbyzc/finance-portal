import React, { useState } from 'react';
import { currencyFlag } from '../../utils/currencyFlag';

/**
 * Varlık ikonu: logo (image) varsa onu; yoksa para birimiyse ülke bayrağı; o da yoksa sembol
 * baş harflerine düşer. BİST/ABD/emtia logosu backend'den, döviz bayrağı flagcdn'den gelir.
 */
export default function AssetIcon({ src, symbol, size = 36, className = '' }) {
    const [failed, setFailed] = useState(false);
    const initials = (symbol || '').replace('.IS', '').replace('-USD', '').slice(0, 4).toUpperCase();

    // Logo yoksa ve sembol bir fiat para kodu ise bayrağa düş.
    const flag = src ? null : currencyFlag(symbol);
    const effectiveSrc = src || flag;
    const showImg = effectiveSrc && !failed;

    return (
        <div
            className={`rounded-lg bg-surface-2 border border-border flex items-center justify-center overflow-hidden shrink-0 text-text-muted font-bold ${className}`}
            style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.26)) }}
        >
            {showImg ? (
                <img
                    src={effectiveSrc}
                    alt=""
                    className={`w-full h-full ${flag ? 'object-cover' : 'object-contain p-1'}`}
                    loading="lazy"
                    onError={() => setFailed(true)}
                />
            ) : (
                <span className="px-0.5 leading-none text-center">{initials}</span>
            )}
        </div>
    );
}
