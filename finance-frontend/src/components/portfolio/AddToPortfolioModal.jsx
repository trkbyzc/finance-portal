import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../config/apiClient';

const AddToPortfolioModal = ({ isOpen, onClose, onSubmit }) => {
    const { t } = useTranslation(['portfolio', 'common', 'navbar']);
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [averagePrice, setAveragePrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingPrice, setFetchingPrice] = useState(false);

    const assetTypes = [
        { value: 'STOCK', labelKey: 'navbar:items.trStocks', endpoint: '/market-data/stocks' },
        { value: 'CRYPTO', labelKey: 'navbar:items.cryptoMarket', endpoint: '/market-data/crypto-currencies' },
        { value: 'CURRENCY', labelKey: 'navbar:categories.currencies', endpoint: '/market-data/currencies' },
        { value: 'COMMODITY', labelKey: 'navbar:categories.commodities', endpoint: '/market-data/commodities' },
        { value: 'BOND', labelKey: 'navbar:items.globalBonds', endpoint: '/market-data/bonds' },
        { value: 'FUND', labelKey: 'navbar:categories.funds', endpoint: '/market-data/tr-funds' }
    ];

    const { data: assets, isLoading: assetsLoading } = useQuery({
        queryKey: ['assets', selectedType],
        queryFn: async () => {
            if (!selectedType) return [];

            const typeConfig = assetTypes.find(at => at.value === selectedType);
            if (!typeConfig) return [];

            const response = await apiClient.get(typeConfig.endpoint);
            return response;
        },
        enabled: !!selectedType
    });

    const filteredAssets = assets?.filter(asset => {
        const searchLower = searchTerm.toLowerCase();
        const symbol = asset.symbol?.toLowerCase() || '';
        const name = asset.name?.toLowerCase() || '';
        const currencyCode = asset.currencyCode?.toLowerCase() || '';

        return symbol.includes(searchLower) ||
            name.includes(searchLower) ||
            currencyCode.includes(searchLower);
    }) || [];

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setStep(2);
        setSearchTerm('');
        setSelectedAsset(null);
    };

    const handleAssetSelect = async (asset) => {
        if (selectedType === 'FUND') {
            setFetchingPrice(true);

            try {
                const symbol = asset.symbol || asset.currencyCode;
                const chartData = await apiClient.get('/market-data/historical', {
                    params: {
                        symbol: symbol,
                        range: '1d',
                        interval: '1d'
                    }
                });

                if (chartData && chartData.length > 0) {
                    const lastPrice = chartData[chartData.length - 1].price;
                    asset.currentPrice = lastPrice;
                }
            } catch (error) {
                console.error('Fund price fetch failed:', error);
                asset.currentPrice = 0;
            } finally {
                setFetchingPrice(false);
            }
        }

        setSelectedAsset({...asset});
        setStep(3);
        setAveragePrice('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSubmit({
                symbol: selectedAsset.symbol || selectedAsset.currencyCode,
                assetType: selectedType,
                quantity: parseFloat(quantity),
                averagePrice: parseFloat(averagePrice)
            });

            setStep(1);
            setSelectedType('');
            setSearchTerm('');
            setSelectedAsset(null);
            setQuantity('');
            setAveragePrice('');

            onClose();
        } catch (error) {
            console.error('Add to portfolio error:', error);
            alert((error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 3) {
            setStep(2);
            setSelectedAsset(null);
        } else if (step === 2) {
            setStep(1);
            setSelectedType('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 rounded-lg w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-muted hover:text-text z-10"
                >
                    <X size={24} />
                </button>

                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-6">{t('portfolio:modal.addTitle')}</h2>

                    <div className="flex items-center justify-center mb-8">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary' : 'bg-surface-hover'}`}>1</div>
                        <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-surface-hover'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary' : 'bg-surface-hover'}`}>2</div>
                        <div className={`w-16 h-1 ${step >= 3 ? 'bg-primary' : 'bg-surface-hover'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary' : 'bg-surface-hover'}`}>3</div>
                    </div>

                    {step === 1 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">{t('common:labels.type')}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {assetTypes.map(type => (
                                    <button
                                        key={type.value}
                                        onClick={() => handleTypeSelect(type.value)}
                                        className="p-4 bg-bg hover:bg-surface-hover border border-border hover:border-primary rounded-lg transition text-left"
                                    >
                                        <div className="font-semibold">{t(type.labelKey)}</div>
                                        <div className="text-sm text-text-muted mt-1">{type.value}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                {t('portfolio:modal.selectAsset')}
                            </h3>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('common:actions.search')}
                                    className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary"
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {fetchingPrice && (
                                    <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg text-center text-primary text-sm">
                                        {t('common:actions.loadingDots')}
                                    </div>
                                )}
                                {assetsLoading ? (
                                    <div className="text-center py-8 text-text-muted">{t('common:status.loading')}</div>
                                ) : filteredAssets.length === 0 ? (
                                    <div className="text-center py-8 text-text-muted">{t('common:status.noResults')}</div>
                                ) : (
                                    filteredAssets.map((asset, idx) => {
                                        const symbol = asset.symbol || asset.currencyCode;
                                        const name = asset.name || asset.currencyName;
                                        const price = asset.price || asset.forexSelling || asset.value || asset.lastPrice || asset.unitPrice || 0;
                                        const hasPriceData = price > 0;
                                        const isFund = selectedType === 'FUND';

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAssetSelect(asset)}
                                                disabled={fetchingPrice}
                                                className="w-full p-3 bg-bg hover:bg-surface-hover border border-border hover:border-primary rounded-lg transition text-left flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-semibold">{symbol}</div>
                                                    <div className="text-sm text-text-muted">{name}</div>
                                                </div>
                                                <div className="text-right">
                                                    {isFund ? (
                                                        <div className="text-xs text-primary">{t('common:actions.select')} →</div>
                                                    ) : hasPriceData ? (
                                                        <div className="font-semibold">{price.toFixed(2)} ₺</div>
                                                    ) : (
                                                        <div className="text-xs text-text-muted">-</div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            <button
                                onClick={handleBack}
                                className="mt-4 w-full px-4 py-2 bg-surface-hover hover:bg-surface-hover rounded font-semibold transition"
                            >
                                ← {t('common:actions.back')}
                            </button>
                        </div>
                    )}

                    {step === 3 && selectedAsset && (
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
                                        {(() => {
                                            const currentPrice = selectedAsset.currentPrice || selectedAsset.price || selectedAsset.forexSelling || selectedAsset.value || selectedAsset.lastPrice || selectedAsset.unitPrice || 0;
                                            return currentPrice > 0 ? (
                                                <div className="font-semibold">{currentPrice.toFixed(2)} ₺</div>
                                            ) : (
                                                <div className="text-sm text-text-muted">-</div>
                                            );
                                        })()}
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
                                <label className="block text-sm font-semibold mb-2">
                                    {t('portfolio:modal.purchasePrice')}
                                </label>
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
                                    onClick={handleBack}
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddToPortfolioModal;
