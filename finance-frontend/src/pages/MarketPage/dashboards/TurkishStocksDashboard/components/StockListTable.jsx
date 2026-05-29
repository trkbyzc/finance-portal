import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../../../../../hooks/useMarketData.js';
import { useNavigate } from 'react-router-dom';
import { formatCompactVolume } from './volumeFormat';

/**
 * BIST hisse listesi tablosu — arama + sortable kolonlar (sembol/fiyat/değişim%/hacim).
 *
 * Hacim sinyali yatırımcı için önemli: hacimli alımlar fiyat hareketini teyit eder.
 * Tabloda "İşlem Tutarı" = price × volume (TL) — sırf lot sayısı yerine parasal hacim daha anlamlı.
 */

const SORT_KEYS = {
    symbol: 'symbol',
    price: 'price',
    change: 'change',
    volume: 'volume'
};

export default function StockListTable() {
    const { data: stocks, loading: isLoading } = useMarketData('tr-stocks');
    const navigate = useNavigate();
    const { t } = useTranslation('markets');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState(SORT_KEYS.symbol);
    const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

    const handleSort = (key) => {
        if (sortBy === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            // Sayısal kolonlar varsayılan desc (büyükten küçüğe), sembol asc
            setSortDir(key === SORT_KEYS.symbol ? 'asc' : 'desc');
        }
    };

    const filteredStocks = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const base = !query
            ? stocks
            : stocks.filter(s =>
                (s.symbol && s.symbol.toLowerCase().includes(query)) ||
                (s.name && s.name.toLowerCase().includes(query))
            );

        const enriched = base.map(s => {
            const price = s.price ?? s.regularMarketPrice ?? 0;
            const change = s.changePercent ?? s.regularMarketChangePercent ?? 0;
            const volume = Number(s.volume ?? 0);
            return { ...s, _price: price, _change: change, _tlVolume: price * volume };
        });

        const dir = sortDir === 'asc' ? 1 : -1;
        return enriched.sort((a, b) => {
            switch (sortBy) {
                case SORT_KEYS.symbol:
                    return dir * ((a.symbol || '').localeCompare(b.symbol || ''));
                case SORT_KEYS.price:
                    return dir * (a._price - b._price);
                case SORT_KEYS.change:
                    return dir * (a._change - b._change);
                case SORT_KEYS.volume:
                    return dir * (a._tlVolume - b._tlVolume);
                default:
                    return 0;
            }
        });
    }, [searchQuery, stocks, sortBy, sortDir]);

    if (isLoading) return <div className="h-96 animate-pulse bg-surface-2 rounded-lg border border-border" />;

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
                <table className="w-full text-left border-collapse min-w-170">
                    <thead className="bg-surface-2 sticky top-0 z-10 shadow-md">
                    <tr>
                        <SortHeader
                            label={`${t('stocks.tableCols.symbol')} / ${t('stocks.tableCols.name')}`}
                            sortKey={SORT_KEYS.symbol}
                            currentSort={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                        />
                        <SortHeader
                            label={t('stocks.tableCols.price')}
                            sortKey={SORT_KEYS.price}
                            currentSort={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            align="right"
                        />
                        <SortHeader
                            label={t('stocks.tableCols.changePercent')}
                            sortKey={SORT_KEYS.change}
                            currentSort={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            align="right"
                        />
                        <SortHeader
                            label={t('stocks.tableCols.volume', 'Hacim (₺)')}
                            sortKey={SORT_KEYS.volume}
                            currentSort={sortBy}
                            sortDir={sortDir}
                            onSort={handleSort}
                            align="right"
                        />
                        <th className="p-4" />
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2e39]">
                    {filteredStocks.length > 0 ? (
                        filteredStocks.map((stock) => {
                            const change = stock._change;
                            const isPositive = change > 0;
                            return (
                                <tr
                                    key={stock.symbol}
                                    onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}?cat=STOCK`)}
                                    className="hover:bg-surface-2 transition cursor-pointer group"
                                >
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="font-bold text-text">{stock.symbol.replace('.IS', '')}</div>
                                        <div className="text-xs text-text-muted mt-1 max-w-[200px] truncate">
                                            {stock.name || ''}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono font-medium text-text whitespace-nowrap">
                                        ₺{stock._price.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-right whitespace-nowrap">
                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold text-sm ${
                                            isPositive ? 'bg-buy/10 text-buy' : change < 0 ? 'bg-sell/10 text-sell' : 'bg-surface-hover text-text-muted'
                                        }`}>
                                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono text-text whitespace-nowrap">
                                        {formatCompactVolume(stock._tlVolume)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <ChevronRight size={18} className="text-text-muted group-hover:text-primary transition" />
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="5" className="p-8 text-center text-text-muted">
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

function SortHeader({ label, sortKey, currentSort, sortDir, onSort, align = 'left' }) {
    const isActive = currentSort === sortKey;
    const Icon = sortDir === 'asc' ? ArrowUp : ArrowDown;
    const alignClass = align === 'right' ? 'justify-end' : 'justify-start';
    return (
        <th className={`p-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap select-none ${align === 'right' ? 'text-right' : 'text-left'}`}>
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className={`inline-flex items-center gap-1.5 ${alignClass} w-full hover:text-text transition ${isActive ? 'text-primary' : ''}`}
            >
                <span>{label}</span>
                {isActive && <Icon size={12} />}
            </button>
        </th>
    );
}
