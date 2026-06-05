import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotify } from '../../context/NotificationContext';

const EditPortfolioModal = ({ isOpen, onClose, onSubmit, asset }) => {
    const { t } = useTranslation(['portfolio', 'common']);
    const notify = useNotify();
    const [quantity, setQuantity] = useState('');
    const [averagePrice, setAveragePrice] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (asset) {
            setQuantity(asset.quantity.toString());
            setAveragePrice(asset.averagePrice.toString());
        }
    }, [asset]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSubmit({
                symbol: asset.symbol,
                assetType: asset.assetType,
                quantity: Number.parseFloat(quantity),
                averagePrice: Number.parseFloat(averagePrice)
            });

            onClose();
            notify({ type: 'success', title: t('portfolio:notify.updated', 'Güncellendi'), message: asset.symbol });
        } catch (error) {
            console.error('Edit error:', error);
            notify({ type: 'error', title: t('portfolio:notify.updateError', 'Güncellenemedi'), message: error.response?.data?.message || error.message || '' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !asset) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 rounded-lg w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-muted hover:text-text"
                >
                    <X size={24} />
                </button>

                <div className="p-4 md:p-6">
                    <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">{t('portfolio:modal.editTitle')}</h2>

                    <div className="bg-bg border border-border rounded-lg p-4 mb-6">
                        <div className="font-semibold text-lg">{asset.symbol}</div>
                        <div className="text-sm text-text-muted">{asset.assetType}</div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">{t('portfolio:modal.quantity')}</label>
                            <input
                                type="number"
                                step="0.00000001"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">
                                {t('portfolio:modal.purchasePrice')} (₺)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={averagePrice}
                                onChange={(e) => setAveragePrice(e.target.value)}
                                className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                                required
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-surface-hover hover:bg-surface-hover rounded-lg font-semibold transition"
                            >
                                {t('common:actions.cancel')}
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
                </div>
            </div>
        </div>
    );
};

export default EditPortfolioModal;
