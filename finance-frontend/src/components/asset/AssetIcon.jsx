import React, { useState } from 'react';

/**
 * Varlık ikonu: logo (image) varsa onu, yüklenemezse/ yoksa sembol baş harflerine düşer.
 * BİST hisselerinde backend TradingView logosu sağlar; gelmeyenler baş harf rozetiyle gösterilir.
 */
export default function AssetIcon({ src, symbol, size = 36, className = '' }) {
    const [failed, setFailed] = useState(false);
    const initials = (symbol || '').replace('.IS', '').replace('-USD', '').slice(0, 4).toUpperCase();
    const showImg = src && !failed;

    return (
        <div
            className={`rounded-lg bg-surface-2 border border-border flex items-center justify-center overflow-hidden shrink-0 text-text-muted font-bold ${className}`}
            style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.26)) }}
        >
            {showImg ? (
                <img
                    src={src}
                    alt=""
                    className="w-full h-full object-contain p-1"
                    loading="lazy"
                    onError={() => setFailed(true)}
                />
            ) : (
                <span className="px-0.5 leading-none text-center">{initials}</span>
            )}
        </div>
    );
}
