import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, BarChart3, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketData } from '../../../../hooks/useMarketData';
import { formatCurrency } from '../../../../utils/formatters/currencyFormatter';

/**
 * Küresel vadeli işlem sözleşmeleri — endeks + tahvil + döviz vadelileri.
 * Emtia futures (GC=F, CL=F vb.) bilinçli olarak burada yok; onlar Commodities sayfasında.
 *
 * Fiyat görüntüsü: <b>USD-only</b>. Tüm Yahoo futures kotasyonları doğal olarak USD bazlı
 * (ZN=F gibi tahvil futures'ları price/100, 6E=F gibi FX futures'lar ise birim USD karşılığı);
 * USDTRY çarpımıyla TRY'ye çevirmek anlamsız olduğu için global currency toggle bu sayfada
 * bypass edilir. Kullanıcı TRY karşılığını görmek isterse `/chart/SYMBOL?cat=FUTURE` detayında
 * ayrı bir conversion görür.
 */
const CATEGORY_ORDER = ['ES=F', 'NQ=F', 'YM=F', 'RTY=F', 'ZN=F', 'ZB=F', 'ZF=F', '6E=F', '6B=F', '6J=F'];

export default function GlobalFuturesDashboard() {
    const { data: futures, loading } = useMarketData('futures');
    const { t } = useTranslation(['markets', 'common']);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const sorted = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        let arr = futures || [];
        if (q) {
            arr = arr.filter(f =>
                (f.symbol || '').toLowerCase().includes(q) ||
                (f.name || '').toLowerCase().includes(q)
            );
        }
        // Tanımlı sıraya göre sırala — bilinmeyenleri sona at
        return [...arr].sort((a, b) => {
            const ai = CATEGORY_ORDER.indexOf(a.symbol);
            const bi = CATEGORY_ORDER.indexOf(b.symbol);
            if (ai === -1 && bi === -1) return (a.symbol || '').localeCompare(b.symbol || '');
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });
    }, [searchQuery, futures]);

    return (
        <div className="min-h-screen bg-bg text-text">
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black uppercase text-text tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-primary rounded-full"></span>
                        {t('markets:globalFutures.headerTitle')}
                    </h1>
                </div>

                <div className="relative w-full md:w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        placeholder={t('common:actions.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border focus:border-primary text-text rounded-lg outline-none text-sm transition"
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="h-96 animate-pulse bg-surface border border-border rounded-2xl" />
            ) : sorted.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-4 flex items-center justify-center text-primary">
                        <BarChart3 size={28} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">{t('markets:globalFutures.emptyTitle')}</h2>
                    <p className="text-text-muted max-w-md mx-auto">{t('markets:globalFutures.emptySub')}</p>
                </div>
            ) : (
                <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-5 border-b border-border bg-surface-2/50">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-bold text-text flex items-center gap-2">
                                <BarChart3 className="text-primary" size={20} />
                                {t('markets:globalFutures.tableTitle')}
                            </h2>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30">
                                USD
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[700px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-2 sticky top-0 z-10 shadow-md">
                                <tr>
                                    <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider">{t('markets:globalFutures.cols.symbol')}</th>
                                    <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider">{t('markets:globalFutures.cols.name')}</th>
                                    <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('markets:globalFutures.cols.price')}</th>
                                    <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('markets:globalFutures.cols.changePercent')}</th>
                                    <th className="p-5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2e39]">
                                {sorted.map((f) => {
                                    const price = Number(f.price ?? 0);
                                    const change = Number(f.changePercent ?? 0);
                                    const positive = change > 0;
                                    return (
                                        <tr
                                            key={f.symbol}
                                            onClick={() => navigate(`/chart/${encodeURIComponent(f.symbol)}?cat=FUTURE`)}
                                            className="hover:bg-surface-2 transition cursor-pointer group"
                                        >
                                            <td className="p-5">
                                                <div className="font-bold tracking-tight">{f.symbol}</div>
                                            </td>
                                            <td className="p-5 text-text-muted text-sm">{f.name || '—'}</td>
                                            <td className="p-5 text-right font-mono font-medium text-text">
                                                {/* USD-only — global toggle bypass (yukarıdaki dosya yorumuna bak) */}
                                                {formatCurrency(price, 'USD')}
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold text-sm ${
                                                    positive ? 'bg-buy/10 text-buy'
                                                    : change < 0 ? 'bg-sell/10 text-sell'
                                                    : 'bg-surface-hover text-text-muted'
                                                }`}>
                                                    {positive ? <TrendingUp size={12} /> : change < 0 ? <TrendingDown size={12} /> : null}
                                                    {positive ? '+' : ''}{change.toFixed(2)}%
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <ChevronRight size={18} className="text-text-muted group-hover:text-primary" />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
          </div>
        </div>
    );
}
