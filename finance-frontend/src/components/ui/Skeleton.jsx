import React from 'react';

/**
 * Tema-aware shimmer skeleton primitive.
 * Renkler --surface-2 / --surface-hover token'larından gelir (3 temada da uyumlu).
 * Boyutu Tailwind class'larıyla ver: <Skeleton className="h-4 w-24" />
 */
export function Skeleton({ className = '', style }) {
    return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

/**
 * Dashboard / market tablosu için tek satır iskeleti (sembol + ad, fiyat, değişim, ok).
 * DashboardTabPanel'deki gerçek satır düzeniyle hizalı durur.
 */
export function MarketRowSkeleton() {
    return (
        <div className="flex items-center gap-3 p-3.5 pl-4">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-2.5 w-28 opacity-70" />
            </div>
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-4 rounded-full" />
        </div>
    );
}

/**
 * N satırlık market tablo iskeleti — spinner yerine kullanılır.
 */
export function MarketTableSkeleton({ rows = 6 }) {
    return (
        <div className="divide-y divide-border/40">
            {Array.from({ length: rows }).map((_, i) => (
                <MarketRowSkeleton key={i} />
            ))}
        </div>
    );
}

export default Skeleton;
