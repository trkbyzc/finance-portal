import React, { useState, useMemo } from 'react';
import { Search, Zap, ChevronRight, Activity, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../../../../hooks/useMarketData';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '../../../../utils/formatters/numberFormatter';

export default function ViopDashboard() {
    const { data: contracts, loading: isLoading } = useMarketData('viop');
    const navigate = useNavigate();
    const { t } = useTranslation(['markets', 'common']);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredContracts = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return contracts;
        return contracts.filter(c =>
            (c.symbol && c.symbol.toLowerCase().includes(query)) ||
            (c.name && c.name.toLowerCase().includes(query))
        );
    }, [searchQuery, contracts]);

    const stats = useMemo(() => {
        if (!contracts.length) return { total: 0, gainers: 0, losers: 0 };
        const gainers = contracts.filter(c => (c.changePercent || c.regularMarketChangePercent || 0) > 0).length;
        const losers = contracts.filter(c => (c.changePercent || c.regularMarketChangePercent || 0) < 0).length;
        return { total: contracts.length, gainers, losers };
    }, [contracts]);

    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-6 lg:p-10">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black uppercase text-text tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-warning rounded-full"></span>
                        {t('markets:viop.headerTitle')}
                    </h1>
                    <p className="text-text-muted text-sm mt-2 ml-5 flex items-center gap-2">
                        <Zap size={16} className="text-warning" /> {t('markets:viop.headerSubtitle')}
                    </p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        placeholder={t('markets:common.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-surface border border-border focus:border-warning text-text rounded-xl outline-none text-sm transition shadow-lg"
                    />
                </div>
            </div>

            {!isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div className="bg-surface border border-border p-5 rounded-xl flex items-center justify-between shadow-lg">
                        <div>
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">{t('markets:viop.contract')}</p>
                            <h3 className="text-2xl font-black text-text">{stats.total}</h3>
                        </div>
                        <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center text-warning">
                            <Clock size={24} />
                        </div>
                    </div>
                    <div className="bg-surface border border-border p-5 rounded-xl flex items-center justify-between shadow-lg">
                        <div>
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">{t('markets:common.topGainers')}</p>
                            <h3 className="text-2xl font-black text-buy">{stats.gainers}</h3>
                        </div>
                        <div className="w-12 h-12 bg-buy/10 rounded-full flex items-center justify-center text-buy">
                            <Activity size={24} />
                        </div>
                    </div>
                    <div className="bg-surface border border-border p-5 rounded-xl flex items-center justify-between shadow-lg">
                        <div>
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">{t('markets:common.topLosers')}</p>
                            <h3 className="text-2xl font-black text-sell">{stats.losers}</h3>
                        </div>
                        <div className="w-12 h-12 bg-sell/10 rounded-full flex items-center justify-center text-sell">
                            <Activity size={24} />
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="h-96 animate-pulse bg-surface border border-border rounded-2xl"></div>
            ) : (
                <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-2 sticky top-0 z-10 shadow-md">
                            <tr>
                                <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider">{t('markets:viop.contract')}</th>
                                <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('markets:viop.settlement')}</th>
                                <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('markets:stocks.tableCols.changePercent')}</th>
                                <th className="p-5"></th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2e39]">
                            {filteredContracts.length > 0 ? (
                                filteredContracts.map((contract) => {
                                    const price = contract.price || contract.regularMarketPrice || 0;
                                    const change = contract.changePercent || contract.regularMarketChangePercent || 0;
                                    const isPositive = change > 0;
                                    const isNegative = change < 0;

                                    return (
                                        <tr
                                            key={contract.symbol}
                                            onClick={() => navigate(`/chart/${encodeURIComponent(contract.symbol)}?cat=VIOP`)}
                                            className="hover:bg-surface-2 transition cursor-pointer group"
                                        >
                                            <td className="p-5">
                                                <div className="font-bold text-text group-hover:text-text transition flex items-center gap-2">
                                                    {contract.symbol}
                                                </div>
                                                <div className="text-[10px] text-text-muted mt-1 max-w-[250px] truncate uppercase">
                                                    {contract.name || ''}
                                                </div>
                                            </td>
                                            <td className="p-5 text-right font-mono font-medium text-text">
                                                {formatNumber(price, 2, 4)}
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-sm ${isPositive ? 'bg-buy/10 text-buy' : isNegative ? 'bg-sell/10 text-sell' : 'bg-surface-hover text-text-muted'}`}>
                                                    {isPositive ? '+' : ''}{change.toFixed(2)}%
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <ChevronRight size={18} className="text-text-muted group-hover:text-warning transition" />
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center text-text-muted">
                                        {t('markets:common.noResults')}
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
