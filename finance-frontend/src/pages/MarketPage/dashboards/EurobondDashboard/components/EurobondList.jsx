import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const fmt = (v, digits = 2) => (v == null || Number.isNaN(Number(v)) ? '—' : Number(v).toFixed(digits));
const ccySymbol = (c) => (c === 'EUR' ? '€' : '$');

/**
 * Türkiye Hazine eurobond listesi — VİOP tarzı tam genişlik tablo.
 * Bir satıra tıklayınca o bononun grafiği açılır (/chart/:isin?cat=EUROBOND).
 * Sütunlar: Bono (İsim + ISIN/Döviz), Kupon, Vade, Fiyat, Getiri, Günlük Değişim.
 */
export default function EurobondList({ bonds, loading }) {
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
        <div>
            {/* Arama */}
            <div className="relative w-full md:w-96 mb-6">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                    type="text"
                    placeholder={t('markets:common.searchPlaceholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface border border-border focus:border-primary text-text rounded-xl outline-none text-sm transition shadow-lg"
                />
            </div>

            <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="overflow-x-auto max-h-175 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-190">
                        <thead className="bg-surface-2 sticky top-0 z-10 shadow-md">
                        <tr>
                            <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider">{t('markets:eurobonds.cols.bond')}</th>
                            <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('markets:eurobonds.cols.coupon')}</th>
                            <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('markets:eurobonds.cols.maturity')}</th>
                            <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('markets:eurobonds.cols.price')}</th>
                            <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('markets:eurobonds.cols.yield')}</th>
                            <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('markets:eurobonds.cols.change')}</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2e39]">
                        {loading ? (
                            <tr><td colSpan="6" className="p-10 text-center text-text-muted">{t('common:status.loading')}</td></tr>
                        ) : !filtered.length ? (
                            <tr><td colSpan="6" className="p-10 text-center text-text-muted">{t('markets:common.noResults')}</td></tr>
                        ) : (
                            filtered.map((b) => {
                                const change = b.changePercent != null ? Number(b.changePercent) : null;
                                const isPositive = change != null && change >= 0;
                                return (
                                    <tr
                                        key={b.isin}
                                        onClick={() => navigate(`/chart/${encodeURIComponent(b.isin)}?cat=EUROBOND`)}
                                        className="hover:bg-surface-2 transition cursor-pointer group"
                                    >
                                        <td className="p-5 whitespace-nowrap">
                                            <div className="font-bold text-text group-hover:text-primary transition">{b.name}</div>
                                            <div className="text-[11px] text-text-muted">{b.isin} · {b.currency}</div>
                                        </td>
                                        <td className="p-5 text-right font-mono text-sm text-text whitespace-nowrap">{fmt(b.coupon)}%</td>
                                        <td className="p-5 text-right font-mono text-sm text-text-muted whitespace-nowrap">{b.maturity || '—'}</td>
                                        <td className="p-5 text-right font-mono text-sm font-bold text-text whitespace-nowrap">{ccySymbol(b.currency)}{fmt(b.price)}</td>
                                        <td className="p-5 text-right font-mono text-sm text-primary whitespace-nowrap">{fmt(b.bondYield)}%</td>
                                        <td className="p-5 text-right font-mono text-sm font-bold whitespace-nowrap">
                                            {change == null ? <span className="text-text-muted">—</span> : (
                                                <span className={isPositive ? 'text-buy' : 'text-sell'}>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-3 text-[11px] text-text-muted">
                {t('markets:common.source')}: markets.businessinsider.com · {t('markets:common.totalCount', { count: filtered.length })}
            </div>
        </div>
    );
}
