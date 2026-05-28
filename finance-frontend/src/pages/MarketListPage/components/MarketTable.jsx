import React from 'react';
import { useTranslation } from 'react-i18next';
import { detectCategoryFromSymbol } from '../../../utils/categoryUtils';
import { formatNumber } from '../../../utils/formatters/numberFormatter';

export default function MarketTable({ data, navigate, routeCategory }) {
    const { t } = useTranslation(['markets', 'common']);
    return (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full min-w-150 text-left border-collapse">
                    <thead>
                    <tr className="bg-surface-2 text-text-muted text-xs uppercase tracking-wider">
                        <th className="p-4 font-bold border-b border-border">{t('markets:stocks.tableCols.symbol')} / {t('markets:stocks.tableCols.name')}</th>
                        <th className="p-4 font-bold border-b border-border text-right">{t('common:labels.price')}</th>
                        <th className="p-4 font-bold border-b border-border text-right">{t('common:labels.change')} (24h)</th>
                        <th className="p-4 font-bold border-b border-border text-center">{t('markets:common.viewChart')}</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2e39]">
                    {data.map((item, idx) => {
                        const symbol = item.symbol || item.yahooSymbol || item.currencyCode;
                        const cleanSymbol = symbol ? symbol.replace('.IS', '').replace('-USD', '') : '—';
                        const isPositive = (item.changePercent || 0) >= 0;

                        const cat = item.assetCategory || routeCategory || detectCategoryFromSymbol(symbol);
                        const target = `/chart/${encodeURIComponent(symbol)}${cat ? `?cat=${cat}` : ''}`;
                        return (
                            <tr
                                key={idx}
                                onClick={() => navigate(target)}
                                className="hover:bg-surface-2 transition-colors cursor-pointer group"
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center font-bold text-[10px] text-text-muted">
                                            {cleanSymbol.substring(0, 2)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-text group-hover:text-primary transition-colors">{cleanSymbol}</div>
                                            <div className="text-xs text-text-muted truncate max-w-[200px]">{item.name || item.currencyName}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-right font-mono text-sm text-text">
                                    {formatNumber(item.price || item.forexSelling)}
                                </td>
                                <td className="p-4 text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${isPositive ? 'bg-buy/10 text-buy' : 'bg-sell/10 text-sell'}`}>
                                            {isPositive ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                                        </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="text-text-muted group-hover:text-primary text-xs font-bold transition-all">{t('markets:common.viewChart')} &rarr;</span>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
