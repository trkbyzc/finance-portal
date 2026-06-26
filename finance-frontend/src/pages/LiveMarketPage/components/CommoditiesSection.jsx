import { ChevronRight, Coins, Droplets, Flame, Gem, Hammer, Wheat, Construction, Loader2 } from 'lucide-react';

const getCommodityIcon = (symbol = '') => {
    const c = symbol.toUpperCase();
    if (c.includes('CL')) return <Droplets className="text-blue-400" size={20} />;
    if (c.includes('GC') || c.includes('GA')) return <Coins className="text-primary" size={20} />;
    if (c.includes('SI') || c.includes('GAG')) return <Gem className="text-gray-400" size={20} />;
    if (c.includes('NG')) return <Flame className="text-orange-500" size={20} />;
    if (c.includes('ZW') || c.includes('ZC')) return <Wheat className="text-yellow-600" size={20} />;
    if (c.includes('HG')) return <Hammer className="text-orange-700" size={20} />;
    return <Construction className="text-gray-500" size={20} />;
};
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../utils/formatters/numberFormatter';
import { displaySymbol } from '../../../utils/symbolDisplay';

export default function CommoditiesSection({ commodityCards, onSelect, isLoading }) {
    const { t } = useTranslation('markets');
    if (isLoading && (!commodityCards || commodityCards.length === 0)) {
        return (
            <div className="mb-16">
                <h2 className="text-2xl font-bold mb-6 text-text flex items-center gap-2">
                    {t('live.commodities')} <ChevronRight className="text-text-muted" size={24} />
                </h2>
                <div className="flex items-center justify-center py-12 text-text-muted">
                    <Loader2 className="animate-spin mr-3" size={20} />
                </div>
            </div>
        );
    }
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
                            onClick={() => onSelect(item.symbol, item.category || 'COMMODITY')}
                            className="flex justify-between items-center p-4 border-b border-border hover:bg-surface transition-colors rounded-lg cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.iconColor} shadow-lg`}>
                                    {getCommodityIcon(item.symbol)}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-bold text-text group-hover:text-text transition-colors">{item.name}</span>
                                    </div>
                                    <span className="text-xs text-text-muted bg-surface-2 px-1.5 py-0.5 rounded w-max mt-1 border border-border">{displaySymbol(item.symbol)}</span>
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
