import { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { nativeCurrencyForType } from '../../utils/currencyConversion';
import { fetchPriceOnDate } from '../../utils/historicalPrice';

/**
 * Mevcut bir holding'in üzerine ek alış yapma modal'ı.
 * Input'lar asset'in NATIVE para biriminde (USD veya TRY) kalır — DB tutarlılığı için.
 * Sadece gösterilen current price / ortalama maliyet global currency'ye dönüşür.
 */
export default function BuyMoreModal({ isOpen, onClose, onSubmit, asset, currentPrice }) {
    const { t } = useTranslation(['portfolio', 'common']);
    const { formatPrice } = useCurrency();
    const native = nativeCurrencyForType(asset?.assetType, asset?.symbol);
    const [quantity, setQuantity] = useState('');
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [priceLoading, setPriceLoading] = useState(false);
    const [datePriceInfo, setDatePriceInfo] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setQuantity('');
            setAmount('');
            setPrice(currentPrice && currentPrice > 0 ? String(currentPrice.toFixed(4)) : '');
            setPurchaseDate('');
            setDatePriceInfo(null);
            setError('');
        }
    }, [isOpen, currentPrice]);

    if (!isOpen || !asset) return null;

    const todayStr = new Date().toISOString().slice(0, 10);
    const qtyNum = parseFloat(quantity);
    const priceNum = parseFloat(price);
    const isValid = qtyNum > 0 && priceNum > 0;
    const total = isValid ? qtyNum * priceNum : 0;

    const unitPrice = () => (priceNum > 0 ? priceNum : (currentPrice > 0 ? currentPrice : 0));
    const handleQuantity = (v) => {
        setQuantity(v);
        const p = unitPrice();
        setAmount(v && p > 0 ? String(+(parseFloat(v) * p).toFixed(2)) : '');
    };
    const handleAmount = (v) => {
        setAmount(v);
        const p = unitPrice();
        setQuantity(v && p > 0 ? String(+(parseFloat(v) / p).toFixed(8)) : '');
    };
    const handlePrice = (v) => {
        setPrice(v);
        const p = parseFloat(v);
        if (quantity && p > 0) setAmount(String(+(parseFloat(quantity) * p).toFixed(2)));
    };
    const handleDate = async (v) => {
        setPurchaseDate(v);
        setDatePriceInfo(null);
        if (!v || !asset?.symbol) return;
        setPriceLoading(true);
        try {
            const p = await fetchPriceOnDate(asset.symbol, asset.assetType, v);
            if (p != null && p > 0) {
                setPrice(String(p));
                setDatePriceInfo({ ok: true, price: p });
                if (quantity) setAmount(String(+(parseFloat(quantity) * p).toFixed(2)));
            } else {
                setDatePriceInfo({ ok: false });
            }
        } finally {
            setPriceLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!isValid) {
            setError(t('portfolio:trade.invalidInputs'));
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await onSubmit({
                symbol: asset.symbol,
                assetType: asset.assetType,
                quantity: qtyNum,
                averagePrice: priceNum
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
                        <div className="w-9 h-9 rounded-lg bg-buy/10 border border-buy/30 flex items-center justify-center text-buy">
                            <Plus size={18} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold uppercase">{asset.symbol}</h2>
                            <p className="text-xs text-text-muted">{t('portfolio:trade.buyMoreTitle')}</p>
                        </div>
                    </div>
                    <div className="text-xs text-text-muted mb-5 mt-2">
                        {t('portfolio:trade.holdingNow', {
                            quantity: Number(asset.quantity ?? 0).toFixed(6),
                            avgPrice: formatPrice(asset.averagePrice, native)
                        })}
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1 uppercase">
                                    {t('portfolio:trade.quantity')}
                                </label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => handleQuantity(e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="any"
                                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1 uppercase">
                                    {t('portfolio:modal.amount', 'Tutar')} ({native})
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => handleAmount(e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="any"
                                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase">
                                {t('portfolio:modal.purchaseDate', 'Alış Tarihi')}
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={purchaseDate}
                                    max={todayStr}
                                    onChange={(e) => handleDate(e.target.value)}
                                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                                />
                                {priceLoading && <Loader2 className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />}
                            </div>
                            {datePriceInfo?.ok && (
                                <p className="text-[11px] text-buy mt-1">{t('portfolio:modal.datePriceFound', 'O tarihteki fiyat')}: {formatPrice(datePriceInfo.price, native)}</p>
                            )}
                            {datePriceInfo && !datePriceInfo.ok && (
                                <p className="text-[11px] text-text-muted mt-1">{t('portfolio:modal.datePriceMissing', 'Bu tarih için fiyat bulunamadı, elle girebilirsiniz.')}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-text-muted mb-1 uppercase flex items-center justify-between">
                                <span>{t('portfolio:trade.price')} ({native})</span>
                                {currentPrice > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setPrice(String(currentPrice.toFixed(4)))}
                                        className="text-[10px] text-primary hover:underline normal-case"
                                    >
                                        {t('portfolio:trade.useMarketPrice', { price: formatPrice(currentPrice, native) })}
                                    </button>
                                )}
                            </label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => handlePrice(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="any"
                                className="w-full bg-bg border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                            />
                        </div>

                        {isValid && (
                            <div className="bg-bg border border-border rounded-lg p-3 flex justify-between items-center text-sm">
                                <span className="text-text-muted">{t('portfolio:trade.total')}</span>
                                <span className="font-mono font-bold text-buy">+ {formatPrice(total, native)}</span>
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
                            className="flex-1 px-4 py-2 bg-buy hover:bg-buy/90 text-white rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                            {t('portfolio:trade.confirmBuy')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
