import { useState, useEffect } from 'react';
import { X, Minus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { nativeCurrencyForType } from '../../utils/currencyConversion';
import { fetchPriceOnDate } from '../../utils/historicalPrice';
import { isYieldBased } from '../../utils/assetNature';
import DatePicker from '../common/DatePicker';

/**
 * Mevcut holding'den satış yapma modal'ı.
 * - Miktar default olarak mevcut tüm holding; sınırlar (0, currentQuantity].
 * - "Hepsini Sat" hızlı butonu max'a çeker.
 * - Fiyat current market'tan otomatik — gerçek satışta o anki piyasa fiyatı.
 * - Eğer current market price 0/yoksa averagePrice fallback.
 */
export default function SellModal({ isOpen, onClose, onSubmit, asset, currentPrice }) {
    const { t } = useTranslation(['portfolio', 'common']);
    const { formatPrice } = useCurrency();
    const native = nativeCurrencyForType(asset?.assetType, asset?.symbol);
    // Tahvil (sabit getiri): "Miktar→Nominal", satış getiri/temiz fiyat (yüzde, KUR YOK); fiyat-bazlı Tutar/K-Z gizli
    // (gerçekçi K/Z getiri→temiz fiyat dönüşümüyle backend'de hesaplanır, frontend spot formülü yanıltıcı olur).
    const isBond = isYieldBased(asset?.assetType);
    const isDibs = isBond && String(asset?.symbol || '').startsWith('TP.');
    const fmtQuote = (v) => (isBond ? (isDibs ? `%${Number(v).toFixed(2)}` : Number(v).toFixed(2)) : formatPrice(v, native));
    const [quantity, setQuantity] = useState('');
    const [priceOverride, setPriceOverride] = useState(null); // tarih seçilince o günün fiyatı
    const [sellDate, setSellDate] = useState('');
    const [priceLoading, setPriceLoading] = useState(false);
    const [datePriceInfo, setDatePriceInfo] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const maxQty = Number(asset?.quantity ?? 0);
    const marketPrice = (currentPrice && currentPrice > 0)
        ? currentPrice
        : Number(asset?.averagePrice ?? 0);
    const effectivePrice = (priceOverride != null && priceOverride > 0) ? priceOverride : marketPrice;

    useEffect(() => {
        if (isOpen && asset) {
            // Default: hepsini sat (max miktar)
            setQuantity(String(maxQty));
            setPriceOverride(null);
            setSellDate('');
            setDatePriceInfo(null);
            setError('');
        }
    }, [isOpen, asset, maxQty]);

    if (!isOpen || !asset) return null;

    const todayStr = new Date().toISOString().slice(0, 10);
    const qtyNum = Number.parseFloat(quantity);
    const isValid = qtyNum > 0 && qtyNum <= maxQty + 1e-9; // floating epsilon
    const isAllOut = qtyNum >= maxQty - 1e-9;
    // VİOP: çarpan (sözleşme büyüklüğü) + yön (short fiyat DÜŞÜŞÜNDE kazanır).
    // Diğer varlıklarda çarpan = 1, dirSign = +1 → davranış birebir aynı kalır.
    const multiplier = Number(asset?.contractSize) > 0 ? Number(asset.contractSize) : 1;
    const isShort = String(asset?.direction || '').toUpperCase() === 'SHORT';
    const dirSign = isShort ? -1 : 1;
    const total = isValid ? qtyNum * effectivePrice * multiplier : 0;        // nominal işlem tutarı
    const costBasis = isValid ? qtyNum * Number(asset.averagePrice ?? 0) * multiplier : 0;
    const pnl = (total - costBasis) * dirSign;                                // short'ta işaret terslenir
    // Yüzde tabanı: VİOP ise satılan kısma düşen TEMİNAT (kaldıraçlı gerçek getiri), değilse maliyet.
    const soldMargin = (Number(asset?.marginPosted) > 0 && maxQty > 0) ? Number(asset.marginPosted) * (qtyNum / maxQty) : 0;
    const pnlBase = soldMargin > 0 ? soldMargin : costBasis;
    const pnlPct = pnlBase > 0 ? (pnl / pnlBase) * 100 : 0;

    const handleQtyChange = (val) => {
        // Negatif veya max üstünü engelle — kullanıcı yazdıkça clamp
        if (val === '' || val === '.') {
            setQuantity(val);
            return;
        }
        const num = Number.parseFloat(val);
        if (Number.isNaN(num)) return;
        if (num < 0) {
            setQuantity('0');
            return;
        }
        if (num > maxQty) {
            setQuantity(String(maxQty));
            return;
        }
        setQuantity(val);
    };

    // Tutar girince fiyattan miktarı hesapla (max ile sınırla)
    const handleAmount = (val) => {
        if (val === '' || effectivePrice <= 0) { setQuantity(''); return; }
        const a = Number.parseFloat(val);
        if (Number.isNaN(a) || a < 0) return;
        const q = Math.min(a / effectivePrice, maxQty);
        setQuantity(String(+q.toFixed(8)));
    };

    const handleDate = async (v) => {
        setSellDate(v);
        setDatePriceInfo(null);
        if (!v || !asset?.symbol) { setPriceOverride(null); return; }
        setPriceLoading(true);
        try {
            const p = await fetchPriceOnDate(asset.symbol, asset.assetType, v);
            if (p != null && p > 0) {
                setPriceOverride(p);
                setDatePriceInfo({ ok: true, price: p });
            } else {
                setPriceOverride(null);
                setDatePriceInfo({ ok: false });
            }
        } finally {
            setPriceLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!isValid) {
            setError(t('portfolio:trade.invalidSellAmount'));
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await onSubmit({
                symbol: asset.symbol,
                assetType: asset.assetType,
                quantity: qtyNum,
                // averagePrice key kullanılıyor backend'de price'a maplenmesi için (portfolioApi.removeFromPortfolio'da)
                averagePrice: effectivePrice,
                // VİOP'ta hangi yönlü pozisyonun (LONG/SHORT) kapatılacağını backend'e bildir
                ...(asset.direction ? { direction: asset.direction } : {})
            });
            onClose();
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || t('portfolio:trade.error'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-text-muted hover:text-text w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover"
                >
                    <X size={20} />
                </button>

                <div className="p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-9 h-9 rounded-lg bg-sell/10 border border-sell/30 flex items-center justify-center text-sell">
                            <Minus size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold uppercase">{asset.symbol}</h2>
                                {asset.direction && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isShort ? 'bg-sell/15 text-sell' : 'bg-buy/15 text-buy'}`}>
                                        {isShort ? t('portfolio:modal.directionShort', 'Kısa (Short)') : t('portfolio:modal.directionLong', 'Uzun (Long)')}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-text-muted">{t('portfolio:trade.sellTitle')}</p>
                        </div>
                    </div>
                    <div className="text-xs text-text-muted mb-5 mt-2">
                        {isBond
                            ? t('portfolio:trade.holdingNowBond', 'Şu anki pozisyon: {{quantity}} nominal · Giriş getirisi {{avgPrice}}', {
                                quantity: maxQty.toFixed(0),
                                avgPrice: fmtQuote(asset.averagePrice)
                            })
                            : t('portfolio:trade.holdingNow', {
                                quantity: maxQty.toFixed(6),
                                avgPrice: fmtQuote(asset.averagePrice)
                            })}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-text-muted mb-1 uppercase flex items-center justify-between">
                                <span>{isBond ? t('portfolio:trade.sellNominal', 'Satılacak Nominal') : t('portfolio:trade.sellQuantity')}</span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity(String(maxQty))}
                                    className="text-[10px] text-sell hover:underline normal-case"
                                >
                                    {t('portfolio:trade.sellAll')}
                                </button>
                            </label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => handleQtyChange(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                max={maxQty}
                                step="any"
                                className="w-full bg-bg border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-sell"
                                autoFocus
                            />
                            <p className="text-[10px] text-text-muted mt-1">
                                {t('portfolio:trade.maxQty', { max: maxQty.toFixed(6) })}
                            </p>
                        </div>

                        {!isBond && (
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1 uppercase">
                                    {t('portfolio:modal.amount', 'Tutar')} ({native})
                                </label>
                                <input
                                    type="number"
                                    value={isValid ? String(+total.toFixed(2)) : ''}
                                    onChange={(e) => handleAmount(e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="any"
                                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-sell"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase">
                                {t('portfolio:trade.sellDate', 'Satış Tarihi')}
                            </label>
                            <div className="relative">
                                <DatePicker
                                    value={sellDate}
                                    onChange={handleDate}
                                    max={todayStr}
                                />
                                {priceLoading && <Loader2 className="animate-spin absolute right-10 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />}
                            </div>
                            {datePriceInfo?.ok && (
                                <p className="text-[11px] text-buy mt-1">{t('portfolio:modal.datePriceFound', 'O tarihteki fiyat')}: {fmtQuote(datePriceInfo.price)}</p>
                            )}
                            {datePriceInfo && !datePriceInfo.ok && (
                                <p className="text-[11px] text-text-muted mt-1">{t('portfolio:modal.datePriceMissing', 'Bu tarih için fiyat bulunamadı, piyasa fiyatı kullanılır.')}</p>
                            )}
                        </div>

                        <div className="bg-bg border border-border rounded-lg p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-muted">{isBond ? t('portfolio:trade.sellYield', 'Satış Getirisi') : t('portfolio:trade.marketPrice')}</span>
                                <span className="font-mono">{fmtQuote(effectivePrice)}</span>
                            </div>
                            {!isBond && (
                                <div className="flex justify-between border-t border-border pt-2">
                                    <span className="text-text-muted">{t('portfolio:trade.total')}</span>
                                    <span className="font-mono font-bold">{formatPrice(total, native)}</span>
                                </div>
                            )}
                            {!isBond && isValid && costBasis > 0 && (
                                <div className={`flex justify-between text-xs ${pnl >= 0 ? 'text-buy' : 'text-sell'}`}>
                                    <span>{t('portfolio:trade.estimatedPnl')}</span>
                                    <span className="font-mono font-semibold">
                                        {pnl >= 0 ? '+' : '-'}{formatPrice(Math.abs(pnl), native)} ({pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                                    </span>
                                </div>
                            )}
                        </div>

                        {isAllOut && isValid && (
                            <div className="bg-warning/10 border border-warning/30 rounded-lg p-2 text-warning text-xs">
                                {t('portfolio:trade.sellAllWarning')}
                            </div>
                        )}

                        {error && (
                            <div className="bg-sell/10 border border-sell/30 rounded-lg p-2 text-sell text-xs">{error}</div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mt-6">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-surface-hover hover:bg-surface-hover rounded-lg font-semibold transition disabled:opacity-50"
                        >
                            {t('common:actions.cancel')}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!isValid || submitting}
                            className="flex-1 px-4 py-2 bg-sell hover:bg-sell/90 text-white rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Minus size={16} />}
                            {t('portfolio:trade.confirmSell')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
