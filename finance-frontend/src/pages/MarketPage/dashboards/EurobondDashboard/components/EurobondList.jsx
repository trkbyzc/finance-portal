import { useMemo, useState } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const fmt = (v, digits = 2) => (v == null || Number.isNaN(Number(v)) ? '—' : Number(v).toFixed(digits));
const ccySymbol = (c) => (c === 'EUR' ? '€' : '$');

/**
 * Türkiye Hazine eurobond listesi — arama + tablo (TurkishFundsDashboard tablo deseni).
 * Satır tıklama → soldaki grafik için seçim; "↗" → tam detay sayfası (/chart/:isin?cat=EUROBOND).
 * Sütunlar: İsim/ISIN, Kupon, Vade, Döviz, Fiyat, Getiri, Günlük Değişim.
 */
export default function EurobondList({ bonds, selected, onSelect, loading }) {
    const navigate = useNavigate();
    const { t } = useTranslation(['markets', 'common']);
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        if (!bonds) return [];
        const q = query.trim().toLowerCase();
        if (!q) return bonds;
        return bonds.filter(b =>
            (b.name || '').toLowerCase().includes(q) ||
            (b.isin || '').toLowerCase().includes(q)
        );
    }, [bonds, query]);

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-2xl flex flex-col h-162.5">
            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                    type="text"
                    placeholder={t('common:searchPlaceholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-2 border border-border text-text rounded-xl outline-none focus:border-warning transition text-sm"
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-text-muted">{t('common:status.loading')}</div>
                ) : !filtered.length ? (
                    <div className="h-full flex items-center justify-center text-text-muted">{t('common:status.noResults')}</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-surface z-10">
                        <tr className="text-text-muted text-[10px] uppercase border-b border-border">
                            <th className="pb-2 font-bold">{t('markets:eurobonds.cols.bond')}</th>
                            <th className="pb-2 font-bold text-right">{t('markets:eurobonds.cols.coupon')}</th>
                            <th className="pb-2 font-bold text-right hidden sm:table-cell">{t('markets:eurobonds.cols.maturity')}</th>
                            <th className="pb-2 font-bold text-right">{t('markets:eurobonds.cols.price')}</th>
                            <th className="pb-2 font-bold text-right">{t('markets:eurobonds.cols.yield')}</th>
                            <th className="pb-2 font-bold text-right">{t('markets:eurobonds.cols.change')}</th>
                            <th className="pb-2"></th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((b) => {
                            const isSelected = selected && selected.isin === b.isin;
                            const change = b.changePercent != null ? Number(b.changePercent) : null;
                            const isPositive = change != null && change >= 0;
                            return (
                                <tr
                                    key={b.isin}
                                    onClick={() => onSelect(b)}
                                    className={`border-b border-border/50 cursor-pointer group ${isSelected ? 'bg-warning/10' : 'hover:bg-surface-2'}`}
                                >
                                    <td className="py-3 pr-2">
                                        <div className={`font-bold text-xs ${isSelected ? 'text-warning' : 'text-text'}`}>{b.name}</div>
                                        <div className="text-[9px] text-text-muted">{b.isin} · {b.currency}</div>
                                    </td>
                                    <td className="py-3 text-right font-mono text-xs text-text">{fmt(b.coupon)}%</td>
                                    <td className="py-3 text-right font-mono text-[11px] text-text-muted hidden sm:table-cell">{b.maturity || '—'}</td>
                                    <td className="py-3 text-right font-mono text-xs font-bold text-text">{ccySymbol(b.currency)}{fmt(b.price)}</td>
                                    <td className="py-3 text-right font-mono text-xs text-warning">{fmt(b.bondYield)}%</td>
                                    <td className="py-3 text-right font-mono text-xs font-bold">
                                        {change == null ? <span className="text-text-muted">—</span> : (
                                            <span className={isPositive ? 'text-buy' : 'text-sell'}>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
                                        )}
                                    </td>
                                    <td className="py-3 pl-1 text-right">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/chart/${encodeURIComponent(b.isin)}?cat=EUROBOND`); }}
                                            title={t('common:viewDetail')}
                                            className="text-text-muted hover:text-warning transition"
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mt-3 pt-3 border-t border-border text-[10px] text-text-muted">
                {t('common:source')}: markets.businessinsider.com · {t('common:totalCount', { count: filtered.length })}
            </div>
        </div>
    );
}
