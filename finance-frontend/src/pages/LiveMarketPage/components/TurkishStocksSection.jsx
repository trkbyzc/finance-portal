import { ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../utils/formatters/numberFormatter';

export default function TurkishStocksSection({ highestVolume, mostVolatile, topGainers, topLosers, onSelect, isLoading }) {
    const { t } = useTranslation('markets');
    const hasAnyData = (highestVolume?.length || mostVolatile?.length || topGainers?.length || topLosers?.length) > 0;
    return (
        <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-text flex items-center gap-2">
                {t('live.turkishStocks')} <ChevronRight className="text-text-muted" size={24} />
            </h2>
            {isLoading && !hasAnyData ? (
                <div className="flex items-center justify-center py-16 text-text-muted">
                    <Loader2 className="animate-spin mr-3" size={20} />
                    <span className="text-sm">{t('live.turkishStocks')}…</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12">
                    <StockListBlock title={t('live.highestVolume')} data={highestVolume} onSelect={onSelect} />
                    <StockListBlock title={t('live.mostVolatile')} data={mostVolatile} onSelect={onSelect} />
                    <StockListBlock title={t('live.topGainers')} data={topGainers} onSelect={onSelect} usePill={true} />
                    <StockListBlock title={t('live.topLosers')} data={topLosers} onSelect={onSelect} usePill={true} />
                </div>
            )}
        </div>
    );
}

function StockListBlock({ title, data, onSelect, usePill = false }) {
    if (!data || data.length === 0) return null;
    return (
        <div className="flex flex-col">
            <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-1 group cursor-pointer w-max">
                {title} <ChevronRight size={18} className="text-border group-hover:text-text transition-colors" />
            </h3>
            <div className="flex flex-col">
                {data.map((item, idx) => {
                    const symbol = item.symbol.replace('.IS', '');
                    const isPositive = item.changePercent >= 0;
                    return (
                        <div key={idx} onClick={() => onSelect(item.symbol)} className="flex items-center justify-between py-3 border-b border-border/50 hover:bg-surface-2 transition-colors cursor-pointer rounded-lg px-2 -mx-2 group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-surface-hover text-text-muted flex items-center justify-center font-bold text-sm group-hover:bg-primary group-hover:text-text transition-colors">
                                    {symbol.substring(0, 2)}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-text group-hover:text-text uppercase">{symbol}</span>
                                    </div>
                                    <span className="text-xs text-text-muted w-32 md:w-48 truncate">{item.name || symbol}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="font-mono font-bold text-text">
                                    {formatNumber(item.price || item.forexSelling)} <span className="text-[10px] text-text-muted">TRY</span>
                                </span>
                                <span className={`text-[11px] font-bold ${usePill ? 'px-2 py-0.5 rounded text-text ' + (isPositive ? 'bg-buy' : 'bg-sell') : (isPositive ? 'text-buy' : 'text-sell')}`}>
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
