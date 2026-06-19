import { Clock, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { nativeCurrencyForType } from '../../utils/currencyConversion';
import { displaySymbol } from '../../utils/symbolDisplay';

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
export default function HoldingsTable({ portfolio, calculateProfitLoss, getDailyChange, inflationFactorBySymbol = null, onOpenHistory, onOpenBuy, onOpenSell, hidden = false }) {
    const { t } = useTranslation(['portfolio', 'common']);
    const { formatPrice } = useCurrency();
    const showReal = !!inflationFactorBySymbol;

    if (!portfolio || portfolio.length === 0) {
        return (
            <div className="bg-surface-2 rounded-lg p-12 text-center">
                <p className="text-text-muted text-lg mb-4">{t('portfolio:holdings.noHoldings')}</p>
                <p className="text-text-muted text-sm">{t('portfolio:holdings.addFirst')}</p>
            </div>
        );
    }

    return (
        <div className="bg-surface-2 rounded-lg overflow-x-auto">
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
                        {showReal && (
                            <th className="hidden md:table-cell text-right p-2 md:p-4 text-text-muted text-xs md:text-sm font-semibold whitespace-nowrap" title={t('portfolio:stats.realPnlTip', 'Enflasyona göre düzeltilmiş kâr/zarar')}>{t('portfolio:holdings.cols.realPnl', 'Reel K/Z')}</th>
                        )}
                        <th className="text-center p-2 md:p-4 text-text-muted text-xs md:text-sm font-semibold whitespace-nowrap">{t('portfolio:holdings.cols.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {portfolio.map((item, idx) => (
                        <HoldingRow
                            key={idx}
                            item={item}
                            calc={calculateProfitLoss(item)}
                            dailyChange={getDailyChange ? getDailyChange(item.symbol, item.assetType) : null}
                            realFactor={inflationFactorBySymbol?.[item.symbol]}
                            showReal={showReal}
                            formatPrice={formatPrice}
                            t={t}
                            hidden={hidden}
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

function HoldingRow({ item, calc, dailyChange, realFactor, showReal = false, formatPrice, t, hidden = false, onOpenHistory, onOpenBuy, onOpenSell }) {
    const native = nativeCurrencyForType(item.assetType, item.symbol);
    const positive = calc.profitLoss >= 0;
    const MASK = '••••';
    // Birim fiyatlar (ort. maliyet, anlık fiyat) varlığın KENDİ biriminde gösterilir.
    const money = (v) => (hidden ? MASK : formatPrice(v, native));
    // Toplam değer / K-Z calculateProfitLoss'tan TRY bazlı gelir → TRY olarak çevrilip 2 ondalıkla gösterilir.
    const money2 = (v) => (hidden ? MASK : formatPrice(v, 'TRY', 2, 2));
    // Reel K/Z: maliyet bu varlığın KENDİ alış tarihinin enflasyon faktörüyle bugünkü liraya çekilir.
    const hasReal = realFactor != null && realFactor > 0;
    const realCost = hasReal ? (calc.costValue || 0) * realFactor : null;
    const realPnl = hasReal ? (calc.currentValue || 0) - realCost : null;
    const realPct = hasReal && realCost > 0 ? (realPnl / realCost) * 100 : null;
    const realPositive = realPnl != null && realPnl >= 0;
    // VİOP sözleşme büyüklüğü (çarpan) — 1'den büyükse adetin yanında göster
    const multiplier = Number(item.contractSize) || 1;
    const showMultiplier = item.assetType === 'FUTURE' && multiplier > 1;
    // VİOP yön (LONG/SHORT) + kaldıraç — sembolün yanında renkli rozet
    const isViop = item.assetType === 'FUTURE';
    const isShort = String(item.direction || '').toUpperCase() === 'SHORT';
    const leverage = Number(item.leverage) || 0;
    // Günlük değişim % (piyasadan) — sembolün yanında küçük renkli rozet
    const dc = (dailyChange != null && !Number.isNaN(Number(dailyChange))) ? Number(dailyChange) : null;
    const dcUp = dc != null && dc >= 0;
    return (
        <tr className="border-b border-border hover:bg-bg transition">
            <td className="p-2 md:p-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm md:text-base">{displaySymbol(item.symbol)}</span>
                    {isViop && item.direction && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isShort ? 'bg-sell/15 text-sell' : 'bg-buy/15 text-buy'}`} title={t('portfolio:modal.direction', 'Pozisyon Yönü')}>
                            {isShort ? 'SHORT' : 'LONG'}{leverage > 0 ? ` ${leverage.toFixed(0)}×` : ''}
                        </span>
                    )}
                    {dc != null && (
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${dcUp ? 'text-buy bg-buy/10' : 'text-sell bg-sell/10'}`}>
                            {dcUp ? '+' : ''}{dc.toFixed(2)}%
                        </span>
                    )}
                </div>
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
            <td className="hidden lg:table-cell p-2 md:p-4 text-right whitespace-nowrap">{money(item.averagePrice)}</td>
            <td className="p-2 md:p-4 text-right text-sm md:text-base whitespace-nowrap">{money(calc.currentPrice)}</td>
            <td className="hidden lg:table-cell p-2 md:p-4 text-right font-semibold whitespace-nowrap">{money2(calc.currentValue)}</td>
            <td className={`p-2 md:p-4 text-right font-semibold text-sm md:text-base whitespace-nowrap ${positive ? 'text-buy' : 'text-sell'}`}>
                {/* Mobile: sadece yüzde; md+: hem tutar hem yüzde */}
                <span className="md:hidden">
                    {hidden ? MASK : `${calc.profitLossPercent >= 0 ? '+' : ''}${calc.profitLossPercent.toFixed(2)}%`}
                </span>
                {/* md+: tutar üstte, yüzde altta (alt alta → daha dar sütun, yatay kaydırma gerekmez) */}
                <span className="hidden md:flex md:flex-col md:items-end md:leading-tight">
                    {hidden ? MASK : (
                        <>
                            <span>{positive ? '+' : '-'}{money2(Math.abs(calc.profitLoss))}</span>
                            <span className="text-xs font-medium opacity-80">
                                {calc.profitLossPercent >= 0 ? '+' : ''}{calc.profitLossPercent.toFixed(2)}%
                            </span>
                        </>
                    )}
                </span>
            </td>
            {showReal && (
                <td className={`hidden md:table-cell p-2 md:p-4 text-right font-semibold text-sm md:text-base whitespace-nowrap ${hasReal ? (realPositive ? 'text-buy' : 'text-sell') : 'text-text-muted'}`}>
                    {hidden ? MASK : hasReal ? (
                        <span className="flex flex-col items-end leading-tight">
                            <span>{realPositive ? '+' : '-'}{money2(Math.abs(realPnl))}</span>
                            <span className="text-xs font-medium opacity-80">
                                {realPct >= 0 ? '+' : ''}{realPct.toFixed(2)}%
                            </span>
                        </span>
                    ) : '—'}
                </td>
            )}
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
