import React from 'react';
import { ChevronRight, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../utils/formatters/numberFormatter';

export default function CommoditiesSection({ commodityCards, onSelect }) {
    const { t } = useTranslation('markets');
    return (
        <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-text flex items-center gap-2">
                {t('live.commodities')} <ChevronRight className="text-text-muted" size={24} />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {commodityCards.map((item, idx) => {
                    const isPositive = item.changePercent >= 0;
                    return (
                        <div
                            key={idx}
                            onClick={() => onSelect(item.symbol)}
                            className="flex justify-between items-center p-4 border-b border-border hover:bg-surface transition-colors rounded-lg cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-text ${item.iconColor} shadow-lg`}>
                                    <Coins size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-bold text-text group-hover:text-text transition-colors">{item.name}</span>
                                    </div>
                                    <span className="text-xs text-text-muted bg-surface-2 px-1.5 py-0.5 rounded w-max mt-1 border border-border">{item.symbol}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="font-mono font-bold text-text">
                                    {formatNumber(item.price, 1, 1)}
                                    <span className="text-[10px] text-text-muted ml-1">{item.currency}</span>
                                </span>
                                <span className={`text-[11px] font-bold ${isPositive ? 'text-buy' : 'text-sell'}`}>
                                    {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
