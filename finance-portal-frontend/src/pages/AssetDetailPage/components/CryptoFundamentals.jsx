import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { stockApi } from '../../../services/api/stockApi';

/** Büyük USD tutarı kısa biçimle: $1.75 T / $38.06 B / $950 M. */
const fmtBig = (n) => {
    if (n == null || !Number.isFinite(n)) return '—';
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)} T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)} B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)} M`;
    return `$${Math.round(n).toLocaleString('en-US')}`;
};
/** Arz miktarı (para birimsiz kısa): 19.7 M / 1.2 B. */
const fmtSupply = (n) => {
    if (n == null || !Number.isFinite(n)) return '—';
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)} B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)} M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)} K`;
    return String(Math.round(n));
};
/** Fiyat: büyükse 2 ondalık, küçükse daha hassas. */
const fmtPrice = (n) => {
    if (n == null || !Number.isFinite(n)) return '—';
    const d = n >= 1 ? 2 : n >= 0.01 ? 4 : 8;
    return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: d })}`;
};

function Stat({ label, value }) {
    return (
        <div className="bg-surface-2 border border-border rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</div>
            <div className="text-sm font-mono font-bold text-text mt-0.5 truncate">{value}</div>
        </div>
    );
}

/**
 * Kripto "Temel Veriler" kartı — detay sayfasına EK olarak (BIST kartının kripto karşılığı).
 * 24 saat aralık çubuğu + piyasa değeri / sıra / 24s hacim / arz / ATH.
 * Veri: /market-data/crypto-fundamentals (CoinGecko).
 */
export default function CryptoFundamentals({ geckoId, symbol }) {
    const { t } = useTranslation(['asset', 'common']);

    const { data, isLoading } = useQuery({
        queryKey: ['cryptoFundamentals', geckoId],
        queryFn: () => stockApi.getCryptoFundamentals(geckoId),
        enabled: !!geckoId,
        staleTime: 5 * 60 * 1000
    });

    if (isLoading) {
        return <div className="bg-surface border border-border rounded-3xl h-28 mb-8 animate-pulse" />;
    }
    if (!data || (data.marketCapUsd == null && data.high24h == null && data.volume24hUsd == null)) return null;

    const sym = data.symbol || symbol || '';
    const lo = data.low24h, hi = data.high24h, p = data.priceUsd;
    const hasRange = lo != null && hi != null && hi > lo && p != null;
    const pos = hasRange ? Math.min(100, Math.max(0, ((p - lo) / (hi - lo)) * 100)) : null;

    return (
        <div className="bg-surface border border-border rounded-3xl p-5 md:p-6 mb-8 shadow-lg">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-primary" />
                    <h2 className="text-lg font-bold text-text">{t('asset:fundamentals.title', 'Temel Veriler')}</h2>
                    {data.name && <span className="text-text-muted text-sm truncate max-w-xs">· {data.name}</span>}
                </div>
                {data.marketCapRank != null && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-md px-2.5 py-1">
                        {t('asset:cryptoFund.rank', 'Sıra')} #{data.marketCapRank}
                    </span>
                )}
            </div>

            {/* 24 saat aralık çubuğu */}
            {hasRange && (
                <div className="mb-5">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                        <span>{t('asset:cryptoFund.range24h', '24 Saat Aralığı')}</span>
                        <span className="font-mono text-text normal-case">{fmtPrice(p)}</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-surface-hover">
                        <div className="absolute inset-y-0 left-0 rounded-full bg-primary/40" style={{ width: `${pos}%` }} />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface shadow"
                            style={{ left: `${pos}%` }}
                            title={fmtPrice(p)}
                        />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-text-muted mt-1.5">
                        <span>{fmtPrice(lo)}</span>
                        <span>{fmtPrice(hi)}</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <Stat label={t('asset:fundamentals.marketCap', 'Piyasa Değeri')} value={fmtBig(data.marketCapUsd)} />
                <Stat label={t('asset:cryptoFund.volume24h', '24s Hacim')} value={fmtBig(data.volume24hUsd)} />
                <Stat label={t('asset:cryptoFund.circSupply', 'Dolaşan Arz')} value={data.circulatingSupply != null ? `${fmtSupply(data.circulatingSupply)} ${sym}` : '—'} />
                <Stat label={t('asset:cryptoFund.maxSupply', 'Maks Arz')} value={data.maxSupply != null ? `${fmtSupply(data.maxSupply)} ${sym}` : '∞'} />
                <Stat label={t('asset:cryptoFund.ath', 'ATH')} value={fmtPrice(data.ath)} />
                <Stat label={t('asset:cryptoFund.atl', 'ATL')} value={fmtPrice(data.atl)} />
            </div>
        </div>
    );
}
