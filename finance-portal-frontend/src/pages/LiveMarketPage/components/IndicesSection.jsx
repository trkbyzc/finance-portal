import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatIndexName } from '../LiveMarketUtils';
import { formatNumber } from '../../../utils/formatters/numberFormatter';

export default function IndicesSection({ indices, selectedSymbol, setSelectedSymbol }) {
    const { t } = useTranslation('markets');
    return (
        <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 text-text flex items-center gap-2">{t('live.indices')} <ChevronRight className="text-text-muted" size={22} /></h2>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                {indices.map((idx, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedSymbol(idx.symbol)}
                        className={`min-w-[260px] p-5 rounded-2xl border transition-all duration-300 text-left ${selectedSymbol === idx.symbol ? 'bg-surface-2 border-primary ring-1 ring-[#2962ff]' : 'bg-surface border-border hover:border-border-strong'}`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-text-muted uppercase tracking-wider">{formatIndexName(idx.symbol)}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${idx.changePercent >= 0 ? 'bg-buy/10 text-buy' : 'bg-sell/10 text-sell'}`}>
                                {idx.changePercent > 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
                            </span>
                        </div>
                        <div className="text-2xl font-mono font-bold tracking-tight">
                            {formatNumber(idx.price)} <span className="text-xs text-text-muted ml-1">TRY</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
