import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../config/apiClient';

const AddToWatchlistModal = ({ isOpen, onClose, onSubmit }) => {
    const { t } = useTranslation(['watchlist', 'common', 'navbar']);
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [submitting, setSubmitting] = useState(null);

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
            return await apiClient.get(typeConfig.endpoint);
        },
        enabled: !!selectedType
    });

    const filteredAssets = assets?.filter(asset => {
        const q = searchTerm.toLowerCase();
        const symbol = asset.symbol?.toLowerCase() || '';
        const name = asset.name?.toLowerCase() || '';
        const currencyCode = asset.currencyCode?.toLowerCase() || '';
        return symbol.includes(q) || name.includes(q) || currencyCode.includes(q);
    }) || [];

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setStep(2);
        setSearchTerm('');
    };

    const handleAssetSelect = async (asset) => {
        const symbol = asset.symbol || asset.currencyCode;
        setSubmitting(symbol);
        try {
            await onSubmit({ symbol, assetType: selectedType });
            setStep(1);
            setSelectedType('');
            setSearchTerm('');
            onClose();
        } catch (error) {
            console.error('Add to watchlist error:', error);
            alert(error.response?.data?.message || error.message);
        } finally {
            setSubmitting(null);
        }
    };

    const handleBack = () => {
        setStep(1);
        setSelectedType('');
        setSearchTerm('');
    };

    const handleClose = () => {
        setStep(1);
        setSelectedType('');
        setSearchTerm('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 rounded-lg w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-text-muted hover:text-text z-10"
                >
                    <X size={24} />
                </button>

                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-6">{t('watchlist:modal.addTitle')}</h2>

                    <div className="flex items-center justify-center mb-8">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary' : 'bg-surface-hover'}`}>1</div>
                        <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-surface-hover'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary' : 'bg-surface-hover'}`}>2</div>
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
                                {t('watchlist:modal.selectAsset')}
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
                                {assetsLoading ? (
                                    <div className="text-center py-8 text-text-muted">{t('common:status.loading')}</div>
                                ) : filteredAssets.length === 0 ? (
                                    <div className="text-center py-8 text-text-muted">{t('common:status.noResults')}</div>
                                ) : (
                                    filteredAssets.map((asset, idx) => {
                                        const symbol = asset.symbol || asset.currencyCode;
                                        const name = asset.name || asset.currencyName;
                                        const price = asset.price || asset.forexSelling || asset.value || asset.lastPrice || asset.unitPrice || 0;
                                        const isSubmittingThis = submitting === symbol;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAssetSelect(asset)}
                                                disabled={submitting !== null}
                                                className="w-full p-3 bg-bg hover:bg-surface-hover border border-border hover:border-primary rounded-lg transition text-left flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-semibold">{symbol}</div>
                                                    <div className="text-sm text-text-muted">{name}</div>
                                                </div>
                                                <div className="text-right">
                                                    {isSubmittingThis ? (
                                                        <div className="text-xs text-primary">{t('common:actions.loadingDots')}</div>
                                                    ) : price > 0 ? (
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
                                disabled={submitting !== null}
                                className="mt-4 w-full px-4 py-2 bg-surface-hover hover:bg-surface-hover rounded font-semibold transition disabled:opacity-50"
                            >
                                ← {t('common:actions.back')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddToWatchlistModal;
