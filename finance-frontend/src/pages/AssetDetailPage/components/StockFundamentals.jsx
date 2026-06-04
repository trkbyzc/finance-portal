import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { stockApi } from '../../../services/api/stockApi';

const CUR = { TRY: '₺', USD: '$' };

/** Büyük tutarı kısa biçimle: 1,75 T / 38,06 Mlr / 950 Mn. */
const fmtBig = (n, cur = '₺') => {
    if (n == null || !Number.isFinite(n)) return '—';
    if (n >= 1e12) return `${cur}${(n / 1e12).toFixed(2)} T`;
    if (n >= 1e9) return `${cur}${(n / 1e9).toFixed(2)} Mlr`;
    if (n >= 1e6) return `${cur}${(n / 1e6).toFixed(2)} Mn`;
    return `${cur}${Math.round(n).toLocaleString('tr-TR')}`;
};
const fmtNum = (n, d = 2) => (n == null || !Number.isFinite(n) ? '—' : Number(n).toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d }));
const fmtVol = (n) => {
    if (n == null || !Number.isFinite(n)) return '—';
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)} Mlr`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)} Mn`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)} B`;
    return String(n);
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
 * Hisse "Temel Veriler" kartı — detay sayfasına EK olarak (mevcut header/grafik/karşılaştırma korunur).
 * 52 hafta aralık çubuğu + piyasa değeri / halka açıklık / sermaye / gün içi aralık / hacim.
 * Veri: /market-data/stock-fundamentals (Yahoo meta + İş Yatırım Özet).
 */
export default function StockFundamentals({ symbol }) {
    const { t } = useTranslation(['asset', 'common']);

    const { data, isLoading } = useQuery({
        queryKey: ['stockFundamentals', symbol],
        queryFn: () => stockApi.getFundamentals(symbol),
        enabled: !!symbol,
        staleTime: 5 * 60 * 1000
    });

    if (isLoading) {
        return <div className="bg-surface border border-border rounded-3xl h-28 mb-8 animate-pulse" />;
    }
    if (!data || (data.price == null && data.week52High == null && data.marketCapTl == null)) return null;

    const cur = CUR[data.currency] || '₺';
    const lo = data.week52Low, hi = data.week52High, p = data.price;
    const hasRange = lo != null && hi != null && hi > lo && p != null;
    const pos = hasRange ? Math.min(100, Math.max(0, ((p - lo) / (hi - lo)) * 100)) : null;

    return (
        <div className="bg-surface border border-border rounded-3xl p-5 md:p-6 mb-8 shadow-lg">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-primary" />
                    <h2 className="text-lg font-bold text-text">{t('asset:fundamentals.title', 'Temel Veriler')}</h2>
                    {data.longName && <span className="text-text-muted text-sm truncate max-w-xs">· {data.longName}</span>}
                </div>
                {data.sector && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-md px-2.5 py-1">
                        {data.sector}
                    </span>
                )}
            </div>

            {/* 52 hafta aralık çubuğu */}
            {hasRange && (
                <div className="mb-5">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                        <span>{t('asset:fundamentals.week52', '52 Hafta Aralığı')}</span>
                        <span className="font-mono text-text normal-case">{cur}{fmtNum(p)}</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-surface-hover">
                        <div className="absolute inset-y-0 left-0 rounded-full bg-primary/40" style={{ width: `${pos}%` }} />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface shadow"
                            style={{ left: `${pos}%` }}
                            title={`${cur}${fmtNum(p)}`}
                        />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-text-muted mt-1.5">
                        <span>{cur}{fmtNum(lo)}</span>
                        <span>{cur}{fmtNum(hi)}</span>
                    </div>
                </div>
            )}

            {/* Temel oranlar / veriler */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <Stat label={t('asset:fundamentals.marketCap', 'Piyasa Değeri')} value={data.marketCapTl != null ? fmtBig(data.marketCapTl, '₺') : '—'} />
                <Stat label={t('asset:fundamentals.marketCapUsd', 'Piyasa Değeri ($)')} value={data.marketCapUsd != null ? fmtBig(data.marketCapUsd, '$') : '—'} />
                <Stat label={t('asset:fundamentals.freeFloat', 'Halka Açıklık')} value={data.freeFloatPct != null ? `%${fmtNum(data.freeFloatPct, 1)}` : '—'} />
                <Stat label={t('asset:fundamentals.capital', 'Sermaye')} value={data.capital != null ? fmtBig(data.capital, '₺') : '—'} />
                <Stat
                    label={t('asset:fundamentals.dayRange', 'Gün İçi Aralık')}
                    value={data.dayLow != null && data.dayHigh != null ? `${cur}${fmtNum(data.dayLow)} – ${cur}${fmtNum(data.dayHigh)}` : '—'}
                />
                <Stat label={t('asset:fundamentals.volume', 'Hacim')} value={fmtVol(data.volume)} />
            </div>
        </div>
    );
}
