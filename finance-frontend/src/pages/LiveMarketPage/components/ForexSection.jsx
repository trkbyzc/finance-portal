import React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFlagUrl, getHeatmapClass } from '../LiveMarketUtils';
import { formatNumber } from '../../../utils/formatters/numberFormatter';

export default function ForexSection({ sortedForexList, onSelect, isLoading }) {
    const { t } = useTranslation(['markets', 'common']);
    if (isLoading && (!sortedForexList || sortedForexList.length === 0)) {
        return (
            <div className="mb-16">
                <h2 className="text-2xl font-bold mb-6 text-text flex items-center gap-2">
                    {t('markets:live.forex')} <ChevronRight className="text-text-muted" size={24} />
                </h2>
                <div className="bg-surface border border-border rounded-2xl flex items-center justify-center py-16 text-text-muted">
                    <Loader2 className="animate-spin mr-3" size={20} />
                </div>
            </div>
        );
    }
    return (
        <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-text flex items-center gap-2">
                {t('markets:live.forex')} <ChevronRight className="text-text-muted" size={24} />
            </h2>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                        <tr className="border-b border-border text-text-muted text-[13px] bg-bg">
                            <th className="p-4 font-normal tracking-wide sticky left-0 bg-bg z-10 w-48">{t('markets:live.forexPair')}</th>
                            <th className="p-4 font-normal text-right tracking-wide w-32">{t('common:labels.price')}</th>
                            <th className="p-4 font-normal text-center tracking-wide border-l border-border w-24">{t('markets:live.today')}</th>
                            <th className="p-4 font-normal text-center tracking-wide border-l border-border w-24">{t('markets:live.week')}</th>
                            <th className="p-4 font-normal text-center tracking-wide border-l border-border w-24">{t('markets:live.month')}</th>
                            <th className="p-4 font-normal text-center tracking-wide border-l border-border w-24">{t('markets:live.sixMonth')}</th>
                            <th className="p-4 font-normal text-center tracking-wide border-l border-border w-24">{t('markets:live.year')}</th>
                            <th className="p-4 font-normal text-center tracking-wide border-l border-border w-24">{t('markets:live.fiveYear')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedForexList.map((currency, i) => (
                            <tr key={i} onClick={() => onSelect(currency.yahooSymbol)} className="border-b border-border/50 hover:bg-surface-2 transition-colors group cursor-pointer">
                                <td className="p-4 font-bold flex items-center gap-3 sticky left-0 bg-surface group-hover:bg-surface-2 transition-colors z-10">
                                    <img src={getFlagUrl(currency.currencyCode)} alt={currency.currencyCode} className="w-6 h-6 rounded-full object-cover shadow-md border border-border"/>
                                    <div className="flex flex-col">
                                        <span className="text-text text-[15px] group-hover:text-primary transition-colors">{currency.currencyCode}<span className="text-text-muted font-normal">:TRY</span></span>
                                    </div>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-text text-[15px]">
                                    {formatNumber(currency.forexSelling, 4, 4)}
                                </td>
                                <td className={`p-4 text-center font-mono font-bold text-[13px] border-l border-border/30 transition-colors ${getHeatmapClass(currency.changePercent)}`}>
                                    {currency.changePercent > 0 ? '+' : ''}{currency.changePercent?.toFixed(2) ?? '-'}%
                                </td>
                                <td className={`p-4 text-center font-mono font-bold text-[13px] border-l border-border/30 transition-colors ${getHeatmapClass(currency.changeWeek)}`}>
                                    {currency.changeWeek > 0 ? '+' : ''}{currency.changeWeek?.toFixed(2) ?? '-'}%
                                </td>
                                <td className={`p-4 text-center font-mono font-bold text-[13px] border-l border-border/30 transition-colors ${getHeatmapClass(currency.changeMonth)}`}>
                                    {currency.changeMonth > 0 ? '+' : ''}{currency.changeMonth?.toFixed(2) ?? '-'}%
                                </td>
                                <td className={`p-4 text-center font-mono font-bold text-[13px] border-l border-border/30 transition-colors ${getHeatmapClass(currency.change6Month)}`}>
                                    {currency.change6Month > 0 ? '+' : ''}{currency.change6Month?.toFixed(2) ?? '-'}%
                                </td>
                                <td className={`p-4 text-center font-mono font-bold text-[13px] border-l border-border/30 transition-colors ${getHeatmapClass(currency.changeYear)}`}>
                                    {currency.changeYear > 0 ? '+' : ''}{currency.changeYear?.toFixed(2) ?? '-'}%
                                </td>
                                <td className={`p-4 text-center font-mono font-bold text-[13px] border-l border-border/30 transition-colors ${getHeatmapClass(currency.change5Year)}`}>
                                    {currency.change5Year > 0 ? '+' : ''}{currency.change5Year?.toFixed(2) ?? '-'}%
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
