import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { portfolioApi } from '../../services/api/portfolioApi';

const fmtDateTime = (iso) => {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return d.toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
};

const fmtNum = (v, digits = 2) => Number(v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/**
 * Tek bir holding için işlem geçmişini gösteren modal.
 * Backend pageable döner — keepPreviousData ile sayfa değişiminde flicker yok.
 * 'Backfilled from portfolio_items' notu olan satırlar info badge ile işaretlenir —
 * bunlar V12 migration'dan gelen synthetic BUY'lar, gerçek alım tarihi kayıp.
 */
export default function TransactionHistoryModal({ isOpen, onClose, symbol }) {
    const { t } = useTranslation(['portfolio', 'common']);
    const [page, setPage] = useState(0);
    const size = 10;
    // DİBS (TP.*): işlem "fiyatı" aslında GETİRİDİR → sütun "Getiri" + "%X" (₺ değil), miktar = nominal.
    const isDibs = String(symbol || '').startsWith('TP.');

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['transactions', symbol, page, size],
        queryFn: () => portfolioApi.getTransactions({ symbol, page, size }),
        enabled: isOpen && !!symbol,
        placeholderData: keepPreviousData
    });

    if (!isOpen) return null;

    const content = data?.content || [];
    const totalPages = data?.totalPages ?? 0;
    const totalElements = data?.totalElements ?? 0;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-text-muted hover:text-text z-10 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover"
                >
                    <X size={20} />
                </button>

                <div className="p-4 md:p-6">
                    <div className="mb-5">
                        <h2 className="text-xl md:text-2xl font-bold uppercase">{symbol}</h2>
                        <p className="text-text-muted text-sm mt-1">
                            {t('portfolio:transactions.subtitle', { count: totalElements })}
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16 text-text-muted">
                            <Loader2 className="animate-spin mr-2" size={20} />
                            <span>{t('common:status.loading')}</span>
                        </div>
                    ) : content.length === 0 ? (
                        <div className="bg-bg border border-border rounded-xl p-10 text-center">
                            <p className="text-text-muted">{t('portfolio:transactions.empty')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-bg border border-border rounded-xl overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-150 text-sm">
                                    <thead className="bg-surface-2">
                                        <tr>
                                            <th className="p-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                                                {t('portfolio:transactions.cols.date')}
                                            </th>
                                            <th className="p-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                                                {t('portfolio:transactions.cols.side')}
                                            </th>
                                            <th className="p-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                                                {isDibs ? t('portfolio:transactions.cols.nominal', 'Nominal') : t('portfolio:transactions.cols.qty')}
                                            </th>
                                            <th className="p-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                                                {isDibs ? t('portfolio:transactions.cols.yield', 'Getiri') : t('portfolio:transactions.cols.price')}
                                            </th>
                                            <th className="p-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                                                {t('portfolio:transactions.cols.notes')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {content.map((tx) => {
                                            const isBuy = tx.side === 'BUY';
                                            const isBackfilled = tx.notes === 'Backfilled from portfolio_items';
                                            return (
                                                <tr key={tx.id} className="hover:bg-surface-hover">
                                                    <td className="p-3 font-mono text-xs">{fmtDateTime(tx.executedAt)}</td>
                                                    <td className="p-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                            isBuy ? 'bg-buy/10 text-buy border border-buy/30' : 'bg-sell/10 text-sell border border-sell/30'
                                                        }`}>
                                                            {isBuy ? t('portfolio:transactions.sideBuy') : t('portfolio:transactions.sideSell')}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right font-mono">{fmtNum(tx.quantity, isDibs ? 0 : 6)}</td>
                                                    <td className="p-3 text-right font-mono">{isDibs ? `%${fmtNum(tx.price)}` : `${fmtNum(tx.price)} ₺`}</td>
                                                    <td className="p-3">
                                                        {isBackfilled ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-warning/10 text-warning border border-warning/30">
                                                                <Info size={10} />
                                                                {t('portfolio:transactions.backfilledBadge')}
                                                            </span>
                                                        ) : tx.notes ? (
                                                            <span className="text-xs text-text-muted italic">{tx.notes}</span>
                                                        ) : (
                                                            <span className="text-xs text-text-muted">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                              </div>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 text-sm">
                                    <span className="text-text-muted">
                                        {t('portfolio:transactions.pageOf', { current: page + 1, total: totalPages })}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(0, p - 1))}
                                            disabled={page === 0 || isFetching}
                                            className="px-2 py-1 rounded border border-border hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            <ChevronLeft size={14} /> {t('common:actions.previous')}
                                        </button>
                                        <button
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={page + 1 >= totalPages || isFetching}
                                            className="px-2 py-1 rounded border border-border hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            {t('common:actions.next')} <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
