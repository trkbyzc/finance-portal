import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePerformanceComparison } from '../../../hooks/usePerformanceComparison';

/**
 * Performans karşılaştırma widget'ı (Midas tarzı) — ComparisonSection'ın altında.
 * Seçili varlık + sabit benchmark'lar (BIST 100 · Mevduat Faizi · Altın · Dolar) seçili dönemde
 * % getirilerine göre azalan sıralı, orantılı yatay barlarla gösterilir. Tek değişen seçili varlık.
 */
const PERIODS = [
    { key: '1mo', label: '1A' },
    { key: '3mo', label: '3A' },
    { key: 'ytd', label: 'YTD' },
    { key: '1y', label: '1Y' },
    { key: '3y', label: '3Y' },
    { key: '5y', label: '5Y' },
];

export default function PerformanceWidget({ asset, baseSymbol }) {
    const { t, i18n } = useTranslation(['charts', 'common']);

    const { symbol, category, label } = useMemo(() => {
        const a = asset || {};
        return {
            symbol: a.yahooSymbol || a.symbol || a.currencyCode || baseSymbol,
            category: a.assetCategory || a.category || 'UNKNOWN',
            label: a.name || a.currencyName || a.symbol || baseSymbol,
        };
    }, [asset, baseSymbol]);

    const labels = useMemo(() => ({
        asset: label,
        bist: t('charts:perf.bist', 'BIST 100'),
        deposit: t('charts:perf.deposit', 'Mevduat Faizi'),
        gold: t('charts:perf.gold', 'Altın'),
        usd: t('charts:perf.usd', 'Dolar'),
    }), [label, t]);

    const { rows, period, setPeriod, isLoading } = usePerformanceComparison(symbol, category, labels);

    const isTr = (i18n.language || 'tr').startsWith('tr');
    const fmtPct = (v) => {
        const sign = v >= 0 ? '+' : '-';
        const num = Math.abs(v).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return isTr ? `${sign}%${num}` : `${sign}${num}%`;
    };
    const maxAbs = Math.max(1, ...rows.map(r => Math.abs(r.ret)));

    return (
        <div id="asset-performance" className="mt-8 scroll-mt-24 bg-surface border border-border rounded-xl p-4 md:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3 min-w-0">
                <div className="min-w-0">
                    <h3 className="text-lg font-bold text-text truncate">{t('charts:perf.title', 'Performans')}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{t('charts:perf.subtitle', 'Seçili dönemde getiri karşılaştırması')}</p>
                </div>
                <div className="flex gap-1 bg-surface-2 rounded-lg p-1 *:min-w-0">
                    {PERIODS.map(p => (
                        <button
                            key={p.key}
                            onClick={() => setPeriod(p.key)}
                            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-md transition ${period === p.key ? 'bg-primary text-primary-fg shadow' : 'text-text-muted hover:text-text'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="py-12 text-center text-text-muted text-sm animate-pulse">{t('charts:perf.loading', 'Yükleniyor…')}</div>
            ) : rows.length === 0 ? (
                <div className="py-12 text-center text-text-muted text-sm">{t('charts:perf.noData', 'Bu dönem için yeterli veri yok')}</div>
            ) : (
                <div className="space-y-3.5">
                    {rows.map(r => {
                        const w = (Math.abs(r.ret) / maxAbs) * 100;
                        const up = r.ret >= 0;
                        const barColor = r.kind === 'asset' ? 'bg-primary' : (up ? 'bg-buy' : 'bg-sell');
                        const valColor = r.kind === 'asset' ? 'text-primary' : (up ? 'text-buy' : 'text-sell');
                        return (
                            <div key={r.key} className="flex items-center gap-2 sm:gap-3">
                                <div
                                    className={`w-24 sm:w-40 shrink-0 truncate text-sm font-semibold ${r.kind === 'asset' ? 'text-primary' : 'text-text'}`}
                                    title={r.label}
                                >
                                    {r.label}
                                </div>
                                <div className="flex-1 min-w-0 h-2.5 bg-surface-2 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.max(2, w)}%` }} />
                                </div>
                                <div className={`w-[72px] sm:w-24 shrink-0 text-right text-sm font-bold tabular-nums ${valColor}`}>
                                    {fmtPct(r.ret)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
