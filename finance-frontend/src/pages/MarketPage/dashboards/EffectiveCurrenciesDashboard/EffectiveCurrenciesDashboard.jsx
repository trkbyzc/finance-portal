import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Banknote, ChevronRight } from 'lucide-react';
import { useMarketData } from '../../../../hooks/useMarketData';
import { getFlagUrl } from '../../../../utils/currencyUtils.js';

const MAJOR_ORDER = ['USD', 'EUR', 'GBP', 'CHF'];

export default function EffectiveCurrenciesDashboard() {
    const { data: effectives, loading } = useMarketData('effective-currencies');
    const { t } = useTranslation(['markets', 'common']);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const sorted = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        let arr = effectives || [];
        if (q) {
            arr = arr.filter(c =>
                (c.currencyCode || '').toLowerCase().includes(q) ||
                (c.currencyName || '').toLowerCase().includes(q)
            );
        }
        // Majorleri üst sıraya çek
        const majors = arr.filter(c => MAJOR_ORDER.includes(c.currencyCode))
            .sort((a, b) => MAJOR_ORDER.indexOf(a.currencyCode) - MAJOR_ORDER.indexOf(b.currencyCode));
        const minors = arr.filter(c => !MAJOR_ORDER.includes(c.currencyCode))
            .sort((a, b) => (a.currencyCode || '').localeCompare(b.currencyCode || ''));
        return [...majors, ...minors];
    }, [searchQuery, effectives]);

    return (
        <div className="min-h-screen bg-bg text-text">
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black uppercase text-text tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-primary rounded-full"></span>
                        {t('markets:effectiveCurrencies.headerTitle')}
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
                    <div className="w-16 h-16 rounded-2xl bg-buy/10 border border-buy/20 mx-auto mb-4 flex items-center justify-center text-buy">
                        <Banknote size={28} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">{t('markets:effectiveCurrencies.emptyTitle')}</h2>
                    <p className="text-text-muted max-w-md mx-auto">{t('markets:effectiveCurrencies.emptySub')}</p>
                </div>
            ) : (
                <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-5 border-b border-border bg-surface-2/50">
                        <h2 className="text-lg font-bold text-text flex items-center gap-2">
                            <Banknote className="text-buy" size={20} />
                            {t('markets:effectiveCurrencies.tableTitle')}
                        </h2>
                    </div>
                    <div className="overflow-x-auto max-h-[700px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-2 sticky top-0 z-10 shadow-md">
                                <tr>
                                    <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider">
                                        {t('common:labels.currency')}
                                    </th>
                                    <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">
                                        {t('markets:effectiveCurrencies.cols.banknoteBuying')}
                                    </th>
                                    <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">
                                        {t('markets:effectiveCurrencies.cols.banknoteSelling')}
                                    </th>
                                    <th className="p-5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2e39]">
                                {sorted.map((c) => {
                                    const code = c.currencyCode;
                                    const buying = Number(c.forexBuying ?? 0);
                                    const selling = Number(c.forexSelling ?? 0);
                                    return (
                                        <tr
                                            key={code}
                                            onClick={() => navigate(`/chart/${encodeURIComponent(code)}?cat=EFFECTIVE_CURRENCY`)}
                                            className="hover:bg-surface-2 transition cursor-pointer group"
                                        >
                                            <td className="p-5 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full overflow-hidden border border-border shrink-0">
                                                    <img src={getFlagUrl(code)} alt="flag" className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-text tracking-tight">{code}</div>
                                                    <div className="text-[10px] text-text-muted uppercase truncate max-w-[220px]">
                                                        {c.currencyName}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right font-mono font-medium text-text-muted">
                                                ₺{buying.toFixed(4)}
                                            </td>
                                            <td className="p-5 text-right font-mono font-medium text-text group-hover:text-buy">
                                                ₺{selling.toFixed(4)}
                                            </td>
                                            <td className="p-5 text-right">
                                                <ChevronRight size={18} className="text-text-muted group-hover:text-buy" />
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
