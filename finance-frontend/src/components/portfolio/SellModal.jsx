import React, { useState, useEffect } from 'react';
import { X, Minus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { nativeCurrencyForType } from '../../utils/currencyConversion';

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
    const [quantity, setQuantity] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const maxQty = Number(asset?.quantity ?? 0);
    const effectivePrice = (currentPrice && currentPrice > 0)
        ? currentPrice
        : Number(asset?.averagePrice ?? 0);

    useEffect(() => {
        if (isOpen && asset) {
            // Default: hepsini sat (max miktar)
            setQuantity(String(maxQty));
            setError('');
        }
    }, [isOpen, asset, maxQty]);

    if (!isOpen || !asset) return null;

    const qtyNum = parseFloat(quantity);
    const isValid = qtyNum > 0 && qtyNum <= maxQty + 1e-9; // floating epsilon
    const isAllOut = qtyNum >= maxQty - 1e-9;
    const total = isValid ? qtyNum * effectivePrice : 0;
    const costBasis = isValid ? qtyNum * Number(asset.averagePrice ?? 0) : 0;
    const pnl = total - costBasis;
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

    const handleQtyChange = (val) => {
        // Negatif veya max üstünü engelle — kullanıcı yazdıkça clamp
        if (val === '' || val === '.') {
            setQuantity(val);
            return;
        }
        const num = parseFloat(val);
        if (isNaN(num)) return;
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
                averagePrice: effectivePrice
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

                <div className="p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-9 h-9 rounded-lg bg-sell/10 border border-sell/30 flex items-center justify-center text-sell">
                            <Minus size={18} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold uppercase">{asset.symbol}</h2>
                            <p className="text-xs text-text-muted">{t('portfolio:trade.sellTitle')}</p>
                        </div>
                    </div>
                    <div className="text-xs text-text-muted mb-5 mt-2">
                        {t('portfolio:trade.holdingNow', {
                            quantity: maxQty.toFixed(6),
                            avgPrice: formatPrice(asset.averagePrice, native)
                        })}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-text-muted mb-1 uppercase flex items-center justify-between">
                                <span>{t('portfolio:trade.sellQuantity')}</span>
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

                        <div className="bg-bg border border-border rounded-lg p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-muted">{t('portfolio:trade.marketPrice')}</span>
                                <span className="font-mono">{formatPrice(effectivePrice, native)}</span>
                            </div>
                            <div className="flex justify-between border-t border-border pt-2">
                                <span className="text-text-muted">{t('portfolio:trade.total')}</span>
                                <span className="font-mono font-bold">{formatPrice(total, native)}</span>
                            </div>
                            {isValid && costBasis > 0 && (
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
