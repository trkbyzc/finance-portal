import React from 'react';
import { Clock, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { nativeCurrencyForType } from '../../utils/currencyConversion';

/**
 * Portföydeki holding listesini render eden tablo. PortfolioPage'in ana tablosu olarak
 * kullanılır; tablo render mantığı sayfa state'inden (modal'ları açan callback'ler) tamamen
 * ayrılmıştır — sayfa sadece data + handler'ları geçirir.
 *
 * Props:
 *   portfolio              : holding listesi (PortfolioItemDto)
 *   calculateProfitLoss    : (item) => { currentPrice, profitLoss, profitLossPercent, currentValue }
 *   onOpenHistory          : (symbol) => void
 *   onOpenBuy              : (item)   => void
 *   onOpenSell             : (item)   => void
 */
export default function HoldingsTable({ portfolio, calculateProfitLoss, onOpenHistory, onOpenBuy, onOpenSell }) {
    const { t } = useTranslation(['portfolio', 'common']);
    const { formatPrice } = useCurrency();

    if (!portfolio || portfolio.length === 0) {
        return (
            <div className="bg-surface-2 rounded-lg p-12 text-center">
                <p className="text-text-muted text-lg mb-4">{t('portfolio:holdings.noHoldings')}</p>
                <p className="text-text-muted text-sm">{t('portfolio:holdings.addFirst')}</p>
            </div>
        );
    }

    return (
        <div className="bg-surface-2 rounded-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-bg border-b border-border">
                    <tr>
                        <th className="text-left p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.asset')}</th>
                        <th className="text-left p-4 text-text-muted font-semibold">{t('common:labels.type')}</th>
                        <th className="text-right p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.quantity')}</th>
                        <th className="text-right p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.avgPrice')}</th>
                        <th className="text-right p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.currentPrice')}</th>
                        <th className="text-right p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.totalValue')}</th>
                        <th className="text-right p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.pnl')}</th>
                        <th className="text-center p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {portfolio.map((item, idx) => (
                        <HoldingRow
                            key={idx}
                            item={item}
                            calc={calculateProfitLoss(item)}
                            formatPrice={formatPrice}
                            t={t}
                            onOpenHistory={onOpenHistory}
                            onOpenBuy={onOpenBuy}
                            onOpenSell={onOpenSell}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function HoldingRow({ item, calc, formatPrice, t, onOpenHistory, onOpenBuy, onOpenSell }) {
    const native = nativeCurrencyForType(item.assetType, item.symbol);
    const positive = calc.profitLoss >= 0;
    return (
        <tr className="border-b border-border hover:bg-bg transition">
            <td className="p-4 font-semibold">{item.symbol}</td>
            <td className="p-4 text-text-muted">{t('common:assetTypes.' + item.assetType, item.assetType)}</td>
            <td className="p-4 text-right">{item.quantity}</td>
            <td className="p-4 text-right">{formatPrice(item.averagePrice, native)}</td>
            <td className="p-4 text-right">{formatPrice(calc.currentPrice, native)}</td>
            <td className="p-4 text-right font-semibold">{formatPrice(calc.currentValue, native)}</td>
            <td className={`p-4 text-right font-semibold ${positive ? 'text-buy' : 'text-sell'}`}>
                {positive ? '+' : '-'}{formatPrice(Math.abs(calc.profitLoss), native)}
                <span className="text-sm ml-1">
                    ({calc.profitLossPercent >= 0 ? '+' : ''}{calc.profitLossPercent.toFixed(2)}%)
                </span>
            </td>
            <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => onOpenHistory(item.symbol)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition"
                        title={t('portfolio:transactions.openHistory')}
                    >
                        <Clock size={18} />
                    </button>
                    <button
                        onClick={() => onOpenBuy(item)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-buy hover:bg-buy/10 transition"
                        title={t('portfolio:trade.buy')}
                    >
                        <Plus size={18} />
                    </button>
                    <button
                        onClick={() => onOpenSell(item)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-sell hover:bg-sell/10 transition"
                        title={t('portfolio:trade.sell')}
                    >
                        <Minus size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
