import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../../context/CurrencyContext';
import { nativeCurrencyForType } from '../../../utils/currencyConversion';

/**
 * AddToPortfolioModal step 3 — quantity + averagePrice form. Submit → parent.onSubmit
 * (parent backend'e POST atar). Backend AssetType enum'una uygun key, parent'tan geliyor.
 */
export default function Step3EntryForm({ selectedAsset, selectedType, selectedBackendValue, onSubmit, onBack }) {
    const { t } = useTranslation(['portfolio', 'common']);
    const { formatPrice } = useCurrency();
    const [quantity, setQuantity] = useState('');
    const [averagePrice, setAveragePrice] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                symbol: selectedAsset.symbol || selectedAsset.currencyCode,
                assetType: selectedBackendValue || selectedType,
                quantity: parseFloat(quantity),
                averagePrice: parseFloat(averagePrice)
            });
        } catch (error) {
            console.error('Add to portfolio error:', error);
            alert((error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const currentPrice = selectedAsset.currentPrice || selectedAsset.price || selectedAsset.forexSelling
        || selectedAsset.value || selectedAsset.lastPrice || selectedAsset.unitPrice || 0;
    const native = nativeCurrencyForType(selectedType, selectedAsset?.symbol || selectedAsset?.currencyCode);

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold mb-4">{t('portfolio:modal.editTitle')}</h3>

            <div className="bg-bg border border-border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="font-semibold text-lg">{selectedAsset.symbol || selectedAsset.currencyCode}</div>
                        <div className="text-sm text-text-muted">{selectedAsset.name || selectedAsset.currencyName}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-text-muted">{t('common:labels.price')}</div>
                        {currentPrice > 0 ? (
                            <div className="font-semibold">{formatPrice(currentPrice, native)}</div>
                        ) : (
                            <div className="text-sm text-text-muted">-</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">{t('portfolio:modal.quantity')}</label>
                <input
                    type="number"
                    step="0.00000001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="100"
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                    required
                    autoFocus
                />
            </div>

            <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">{t('portfolio:modal.purchasePrice')}</label>
                <input
                    type="number"
                    step="0.01"
                    value={averagePrice}
                    onChange={(e) => setAveragePrice(e.target.value)}
                    placeholder="45.50"
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                    required
                />
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 px-4 py-3 bg-surface-hover hover:bg-surface-hover rounded-lg font-semibold transition"
                >
                    ← {t('common:actions.back')}
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary-hover rounded-lg font-semibold transition disabled:opacity-50"
                >
                    {loading ? t('common:actions.loadingDots') : t('common:actions.save')}
                </button>
            </div>
        </form>
    );
}
