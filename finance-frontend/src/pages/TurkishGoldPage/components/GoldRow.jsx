import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../utils/formatters/numberFormatter';

export default function GoldRow({ gold, onClick, clickable = true }) {
    const { t } = useTranslation('common');
    const sellPrice = gold.price || 0;
    const buyPrice = gold.buyPrice || sellPrice;
    const isPositive = gold.changePercent >= 0;

    return (
        <div
            onClick={onClick}
            className={`flex flex-col md:flex-row items-center justify-between bg-surface border border-border rounded-2xl p-4 md:p-5 shadow-lg transition-all group ${clickable ? 'hover:border-warning/50 hover:bg-surface-2 cursor-pointer' : ''}`}
        >
            <div className="flex items-center gap-4 w-full md:w-1/3 mb-4 md:mb-0">
                <div className="w-12 h-12 rounded-full bg-bg flex shrink-0 items-center justify-center font-black text-warning border border-warning/20 shadow-[0_0_10px_rgba(255,152,0,0.1)] overflow-hidden">
                    {gold.image ? (
                        <img
                            src={gold.image}
                            alt=""
                            className="w-full h-full object-contain p-2"
                            loading="lazy"
                            onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = 'AU'; }}
                        />
                    ) : 'AU'}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-text group-hover:text-warning transition-colors">{gold.name}</h3>
                    <span className="text-xs text-text-muted font-medium">{gold.symbol.replace(/_/g, ' ')}</span>
                </div>
            </div>

            <div className="flex items-center justify-between md:justify-center gap-8 w-full md:w-1/3 bg-bg md:bg-transparent p-3 md:p-0 rounded-xl border border-border md:border-none mb-4 md:mb-0">
                <div className="flex flex-col text-left md:text-right w-1/2 md:w-auto">
                    <span className="text-text-muted text-[10px] font-bold uppercase mb-1">{t('labels.buyRate')}</span>
                    <span className="text-lg font-mono font-bold text-text">
                        {formatNumber(buyPrice)} ₺
                    </span>
                </div>
                <div className="hidden md:block w-px h-10 bg-surface-hover"></div>
                <div className="flex flex-col text-right md:text-left w-1/2 md:w-auto">
                    <span className="text-text-muted text-[10px] font-bold uppercase mb-1">{t('labels.sellRate')}</span>
                    <span className="text-lg font-mono font-bold text-warning">
                        {formatNumber(sellPrice)} ₺
                    </span>
                </div>
            </div>

            <div className="flex justify-end w-full md:w-1/3">
                <span className={`flex items-center justify-center gap-1 text-sm font-bold px-4 py-2 rounded-xl border w-full md:w-auto ${isPositive ? 'bg-buy/10 text-buy border-buy/20' : 'bg-sell/10 text-sell border-sell/20'}`}>
                    {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {isPositive ? '+' : ''}{(gold.changePercent || 0).toFixed(2)}%
                </span>
            </div>
        </div>
    );
}
