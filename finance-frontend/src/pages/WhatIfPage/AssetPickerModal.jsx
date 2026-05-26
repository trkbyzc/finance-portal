import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../config/apiClient';

/**
 * 2-step asset seçici (AddToWatchlistModal'dan kopyalanmış sade versiyon).
 * Step 1: asset tipi seç → Step 2: tipin listesinden tek tek seç → onSelect ile parent'a gönder.
 * Persist YOK; sadece seçim yapar.
 */
export default function AssetPickerModal({ isOpen, onClose, onSelect, existingKeys = [] }) {
    const { t } = useTranslation(['whatIf', 'common', 'navbar', 'simulation']);
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const assetTypes = [
        { value: 'STOCK', endpoint: '/market-data/stocks' },
        { value: 'CRYPTO', endpoint: '/market-data/crypto-currencies' },
        { value: 'CURRENCY', endpoint: '/market-data/currencies' },
        { value: 'COMMODITY', endpoint: '/market-data/commodities' },
        { value: 'BOND', endpoint: '/market-data/bonds' },
        { value: 'FUND', endpoint: '/market-data/tr-funds' }
    ];

    const { data: assets, isLoading } = useQuery({
        queryKey: ['assets-picker', selectedType],
        queryFn: async () => {
            const cfg = assetTypes.find(at => at.value === selectedType);
            if (!cfg) return [];
            return await apiClient.get(cfg.endpoint);
        },
        enabled: !!selectedType
    });

    const filtered = (assets || []).filter(a => {
        const q = searchTerm.toLowerCase();
        const symbol = (a.symbol || a.currencyCode || '').toLowerCase();
        const name = (a.name || a.currencyName || '').toLowerCase();
        return symbol.includes(q) || name.includes(q);
    });

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setStep(2);
        setSearchTerm('');
    };

    const handleAssetSelect = (asset) => {
        const symbol = asset.symbol || asset.currencyCode;
        const key = `${selectedType}:${symbol}`;
        if (existingKeys.includes(key)) {
            // zaten ekli — UI'da sessiz "exists" göstergesi
            return;
        }
        onSelect({ symbol, assetType: selectedType, label: asset.name || asset.currencyName || symbol });
        reset();
    };

    const reset = () => {
        setStep(1);
        setSelectedType('');
        setSearchTerm('');
    };

    const handleClose = () => {
        reset();
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
                    <h2 className="text-2xl font-bold mb-6">{t('whatIf:modal.title')}</h2>

                    <div className="flex items-center justify-center mb-8">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-fg' : 'bg-surface-hover'}`}>1</div>
                        <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-surface-hover'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-fg' : 'bg-surface-hover'}`}>2</div>
                    </div>

                    {step === 1 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">{t('whatIf:modal.stepType')}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {assetTypes.map(type => (
                                    <button
                                        key={type.value}
                                        onClick={() => handleTypeSelect(type.value)}
                                        className="p-4 bg-bg hover:bg-surface-hover border border-border hover:border-primary rounded-lg transition text-left"
                                    >
                                        <div className="font-semibold">{t(`simulation:types.${type.value}`, type.value)}</div>
                                        <div className="text-xs text-text-muted mt-1">{t(`simulation:types.${type.value}Sub`, '')}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">{t('whatIf:modal.stepAsset')}</h3>

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
                                {isLoading ? (
                                    <div className="text-center py-8 text-text-muted">{t('common:status.loading')}</div>
                                ) : filtered.length === 0 ? (
                                    <div className="text-center py-8 text-text-muted">{t('common:status.noResults')}</div>
                                ) : (
                                    filtered.map((asset, idx) => {
                                        const symbol = asset.symbol || asset.currencyCode;
                                        const name = asset.name || asset.currencyName;
                                        const key = `${selectedType}:${symbol}`;
                                        const exists = existingKeys.includes(key);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAssetSelect(asset)}
                                                disabled={exists}
                                                className="w-full p-3 bg-bg hover:bg-surface-hover border border-border hover:border-primary rounded-lg transition text-left flex justify-between items-center disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-semibold">{symbol}</div>
                                                    <div className="text-sm text-text-muted">{name}</div>
                                                </div>
                                                {exists && (
                                                    <span className="text-xs text-text-muted">{t('whatIf:modal.alreadyAdded')}</span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            <button
                                onClick={() => { setStep(1); setSelectedType(''); setSearchTerm(''); }}
                                className="mt-4 w-full px-4 py-2 bg-surface-hover hover:bg-surface-hover rounded font-semibold transition"
                            >
                                ← {t('common:actions.back')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
