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
 * Responsive strategy: 8 kolon mobile'da yatay scroll yerine progressive disclosure ile gizlenir.
 *   - Her zaman: Varlık, Anlık Fiyat, K/Z, Aksiyon
 *   - sm+:       Adet (Quantity)
 *   - md+:       Tip (Type)
 *   - lg+:       Ort. Maliyet, Toplam Değer
 * Mobile kullanıcı varlığın altında ek detay görür (asset cell içinde gizli kolonların özet rozetleri).
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
                        <th className="text-left p-2 md:p-4 text-text-muted text-xs md:text-sm font-semibold whitespace-nowrap">{t('portfolio:holdings.cols.asset')}</th>
                        <th className="hidden md:table-cell text-left p-2 md:p-4 text-text-muted text-xs md:text-sm font-semibold whitespace-nowrap">{t('common:labels.type')}</th>
                        <th className="hidden sm:table-cell text-right p-2 md:p-4 text-text-muted text-xs md:text-sm font-semibold whitespace-nowrap">{t('portfolio:holdings.cols.quantity')}</th>
                        <th className="hidden lg:table-cell text-right p-2 md:p-4 text-text-muted text-xs md:text-sm font-semibold whitespace-nowrap">{t('portfolio:holdings.cols.avgPrice')}</th>
                        <th className="text-right p-2 md:p-4 text-text-muted text-xs md:text-sm font-semibold whitespace-nowrap">{t('portfolio:holdings.cols.currentPrice')}</th>
                        <th className="hidden lg:table-cell text-right p-2 md:p-4 text-text-muted text-xs md:text-sm font-semibold whitespace-nowrap">{t('portfolio:holdings.cols.totalValue')}</th>
                        <th className="text-right p-2 md:p-4 text-text-muted text-xs md:text-sm font-semibold whitespace-nowrap">{t('portfolio:holdings.cols.pnl')}</th>
                        <th className="text-center p-2 md:p-4 text-text-muted text-xs md:text-sm font-semibold whitespace-nowrap">{t('portfolio:holdings.cols.actions')}</th>
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
    // VİOP sözleşme büyüklüğü (çarpan) — 1'den büyükse adetin yanında göster
    const multiplier = Number(item.contractSize) || 1;
    const showMultiplier = item.assetType === 'FUTURE' && multiplier > 1;
    return (
        <tr className="border-b border-border hover:bg-bg transition">
            <td className="p-2 md:p-4 whitespace-nowrap">
                <div className="font-semibold text-sm md:text-base">{item.symbol}</div>
                {/* Mobile-only: tip + adet özet rozeti (md altında gizli kolonların yerine) */}
                <div className="md:hidden mt-0.5 text-[10px] text-text-muted">
                    {t('common:assetTypes.' + item.assetType, item.assetType)}
                    <span className="sm:hidden"> · {item.quantity}{showMultiplier ? ` × ${multiplier}` : ''}</span>
                </div>
            </td>
            <td className="hidden md:table-cell p-2 md:p-4 text-text-muted whitespace-nowrap">{t('common:assetTypes.' + item.assetType, item.assetType)}</td>
            <td className="hidden sm:table-cell p-2 md:p-4 text-right whitespace-nowrap">
                {item.quantity}
                {showMultiplier && <span className="text-text-muted text-[11px] ml-1" title={t('portfolio:modal.contractSize')}>× {multiplier}</span>}
            </td>
            <td className="hidden lg:table-cell p-2 md:p-4 text-right whitespace-nowrap">{formatPrice(item.averagePrice, native)}</td>
            <td className="p-2 md:p-4 text-right text-sm md:text-base whitespace-nowrap">{formatPrice(calc.currentPrice, native)}</td>
            <td className="hidden lg:table-cell p-2 md:p-4 text-right font-semibold whitespace-nowrap">{formatPrice(calc.currentValue, native)}</td>
            <td className={`p-2 md:p-4 text-right font-semibold text-sm md:text-base whitespace-nowrap ${positive ? 'text-buy' : 'text-sell'}`}>
                {/* Mobile: sadece yüzde; md+: hem tutar hem yüzde */}
                <span className="md:hidden">
                    {calc.profitLossPercent >= 0 ? '+' : ''}{calc.profitLossPercent.toFixed(2)}%
                </span>
                <span className="hidden md:inline">
                    {positive ? '+' : '-'}{formatPrice(Math.abs(calc.profitLoss), native)}
                    <span className="text-sm ml-1">
                        ({calc.profitLossPercent >= 0 ? '+' : ''}{calc.profitLossPercent.toFixed(2)}%)
                    </span>
                </span>
            </td>
            <td className="p-1 sm:p-2 md:p-4 text-center whitespace-nowrap">
                <div className="flex items-center justify-center gap-0.5 sm:gap-1 md:gap-2">
                    <button
                        onClick={() => onOpenHistory(item.symbol)}
                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center rounded-md md:rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition"
                        title={t('portfolio:transactions.openHistory')}
                    >
                        <Clock size={14} className="md:size-4" />
                    </button>
                    <button
                        onClick={() => onOpenBuy(item)}
                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center rounded-md md:rounded-lg text-buy hover:bg-buy/10 transition"
                        title={t('portfolio:trade.buy')}
                    >
                        <Plus size={14} className="md:size-4" />
                    </button>
                    <button
                        onClick={() => onOpenSell(item)}
                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center rounded-md md:rounded-lg text-sell hover:bg-sell/10 transition"
                        title={t('portfolio:trade.sell')}
                    >
                        <Minus size={14} className="md:size-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}
