import React, { useState, useMemo } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../../../../../hooks/useMarketData.js';
import { useNavigate } from 'react-router-dom';

export default function StockListTable() {
    const { data: stocks, loading: isLoading } = useMarketData('tr-stocks');
    const navigate = useNavigate();
    const { t } = useTranslation('markets');
    const [searchQuery, setSearchQuery] = useState("");

    const filteredStocks = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return stocks;
        return stocks.filter(s =>
            (s.symbol && s.symbol.toLowerCase().includes(query)) ||
            (s.name && s.name.toLowerCase().includes(query))
        );
    }, [searchQuery, stocks]);

    if (isLoading) return <div className="h-96 animate-pulse bg-surface-2 rounded-lg border border-border"></div>;

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-text">{t('stocks.allStocks')}</h2>
                <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        placeholder={t('common.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border focus:border-primary text-text rounded-lg outline-none text-sm transition"
                    />
                </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar rounded-lg border border-border">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-2 sticky top-0 z-10 shadow-md">
                    <tr>
                        <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">{t('stocks.tableCols.symbol')} / {t('stocks.tableCols.name')}</th>
                        <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('stocks.tableCols.price')}</th>
                        <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('stocks.tableCols.changePercent')}</th>
                        <th className="p-4"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2e39]">
                    {filteredStocks.length > 0 ? (
                        filteredStocks.map((stock) => {
                            const price = stock.price || stock.regularMarketPrice || 0;
                            const change = stock.changePercent || stock.regularMarketChangePercent || 0;
                            const isPositive = change > 0;

                            return (
                                <tr
                                    key={stock.symbol}
                                    onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}?cat=STOCK`)}
                                    className="hover:bg-surface-2 transition cursor-pointer group"
                                >
                                    <td className="p-4">
                                        <div className="font-bold text-text group-hover:text-text transition">
                                            {stock.symbol.replace('.IS', '')}
                                        </div>
                                        <div className="text-xs text-text-muted mt-1 max-w-[200px] truncate">
                                            {stock.name || ''}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono font-medium text-text">
                                        ₺{price.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold text-sm ${isPositive ? 'bg-buy/10 text-buy' : change < 0 ? 'bg-sell/10 text-sell' : 'bg-surface-hover text-text-muted'}`}>
                                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <ChevronRight size={18} className="text-text-muted group-hover:text-primary transition" />
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="4" className="p-8 text-center text-text-muted">
                                {t('common.noResults')}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
