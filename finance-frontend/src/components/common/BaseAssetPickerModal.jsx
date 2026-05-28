import React, { useState } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../config/apiClient';
import { useCurrency } from '../../context/CurrencyContext';
import { nativeCurrencyForType } from '../../utils/currencyConversion';

/**
 * Generic 2-step asset picker — type seç (step 1) → asset seç (step 2) → onSelect callback.
 *
 * Eskiden AddToWatchlistModal ve WhatIf AssetPickerModal aynı pattern'i ayrı ayrı taşıyordu;
 * artık ikisi de bu base'i kullanır. AddToPortfolioModal 3-step olduğu için ayrı kalır
 * (step 3 = quantity/price detayları) — ama bu base ileride o akışa da entegre edilebilir.
 *
 * Props:
 *   isOpen         : modal görünür mü
 *   onClose        : kapatma callback
 *   onSelect       : ({ symbol, assetType, backendValue, label, asset }) => void
 *                    backendValue = AssetType enum'una map'lenmiş hali (GOLD→COMMODITY vs.)
 *   titleKey       : i18n key, modal başlığı
 *   submittingKey  : opsiyonel — onSelect içinde async iş yapan parent'lar için
 *                    "submitting" göstergesi için tutulan symbol string'i
 *   excludeKeys    : opsiyonel — `${backendValue}:${symbol}` formatında zaten seçili asset'ler;
 *                    listede "alreadyAdded" disabled gösterir
 *   showPrices     : default true — step-2 listesinde fiyat sütunu gösterilsin mi
 */
const ASSET_TYPES = [
    { uiKey: 'STOCK',     backendValue: 'STOCK',     endpoint: '/market-data/stocks' },
    { uiKey: 'CRYPTO',    backendValue: 'CRYPTO',    endpoint: '/market-data/crypto-currencies' },
    { uiKey: 'CURRENCY',  backendValue: 'CURRENCY',  endpoint: '/market-data/currencies' },
    { uiKey: 'GOLD',      backendValue: 'COMMODITY', endpoint: '/market-data/turkish-gold' },
    { uiKey: 'COMMODITY', backendValue: 'COMMODITY', endpoint: '/market-data/commodities' },
    { uiKey: 'BOND_TR',   backendValue: 'BOND',      endpoint: '/market-data/tr-bonds' },
    { uiKey: 'BOND',      backendValue: 'BOND',      endpoint: '/market-data/bonds' },
    { uiKey: 'FUND',      backendValue: 'FUND',      endpoint: '/market-data/tr-funds' }
];

export default function BaseAssetPickerModal({
    isOpen,
    onClose,
    onSelect,
    titleKey,
    submittingKey = null,
    excludeKeys = [],
    showPrices = true
}) {
    const { t } = useTranslation(['common', 'navbar']);
    const { formatPrice } = useCurrency();
    const [step, setStep] = useState(1);
    const [selectedUiKey, setSelectedUiKey] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const selectedConfig = ASSET_TYPES.find(at => at.uiKey === selectedUiKey);

    const { data: assets, isLoading } = useQuery({
        queryKey: ['asset-picker', selectedUiKey],
        queryFn: async () => {
            if (!selectedConfig) return [];
            return await apiClient.get(selectedConfig.endpoint);
        },
        enabled: !!selectedConfig
    });

    const filtered = (assets || []).filter(a => {
        const q = searchTerm.toLowerCase();
        const symbol = (a.symbol || a.currencyCode || '').toLowerCase();
        const name = (a.name || a.currencyName || '').toLowerCase();
        return symbol.includes(q) || name.includes(q);
    });

    const handleTypeSelect = (uiKey) => {
        setSelectedUiKey(uiKey);
        setStep(2);
        setSearchTerm('');
    };

    const handleAssetSelect = (asset) => {
        const symbol = asset.symbol || asset.currencyCode;
        const backendValue = selectedConfig?.backendValue || selectedUiKey;
        const excludeKey = `${backendValue}:${symbol}`;
        if (excludeKeys.includes(excludeKey)) return;
        onSelect({
            symbol,
            assetType: backendValue,
            backendValue,
            uiKey: selectedUiKey,
            label: asset.name || asset.currencyName || symbol,
            asset
        });
    };

    const reset = () => {
        setStep(1);
        setSelectedUiKey('');
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

                <div className="p-4 md:p-6">
                    <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">{t(titleKey)}</h2>

                    {/* Step indicator */}
                    <div className="flex items-center justify-center mb-8">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-fg' : 'bg-surface-hover'}`}>1</div>
                        <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-surface-hover'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-fg' : 'bg-surface-hover'}`}>2</div>
                    </div>

                    {/* Step 1: Type */}
                    {step === 1 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">{t('common:labels.type')}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {ASSET_TYPES.map(type => (
                                    <button
                                        key={type.uiKey}
                                        onClick={() => handleTypeSelect(type.uiKey)}
                                        className="p-4 bg-bg hover:bg-surface-hover border border-border hover:border-primary rounded-lg transition text-left"
                                    >
                                        <div className="font-semibold">
                                            {t('common:assetTypes.' + type.uiKey, type.uiKey)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Asset */}
                    {step === 2 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">{t('common:labels.selectAsset', 'Varlık Seç')}</h3>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
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
                                    <div className="text-center py-8 text-text-muted inline-flex items-center justify-center gap-2 w-full">
                                        <Loader2 className="animate-spin" size={16} /> {t('common:status.loading')}
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div className="text-center py-8 text-text-muted">{t('common:status.noResults')}</div>
                                ) : (
                                    filtered.map((asset, idx) => {
                                        const symbol = asset.symbol || asset.currencyCode;
                                        const name = asset.name || asset.currencyName;
                                        const price = asset.price || asset.forexSelling || asset.value || asset.lastPrice || asset.unitPrice || 0;
                                        const excludeKey = `${selectedConfig?.backendValue || selectedUiKey}:${symbol}`;
                                        const isExcluded = excludeKeys.includes(excludeKey);
                                        const isSubmitting = submittingKey === symbol;
                                        const native = nativeCurrencyForType(selectedUiKey, symbol);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAssetSelect(asset)}
                                                disabled={isExcluded || submittingKey !== null}
                                                className="w-full p-3 bg-bg hover:bg-surface-hover border border-border hover:border-primary rounded-lg transition text-left flex justify-between items-center disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-semibold">{symbol}</div>
                                                    <div className="text-sm text-text-muted">{name}</div>
                                                </div>
                                                <div className="text-right">
                                                    {isSubmitting ? (
                                                        <div className="text-xs text-primary inline-flex items-center gap-1">
                                                            <Loader2 className="animate-spin" size={12} /> {t('common:actions.loadingDots')}
                                                        </div>
                                                    ) : isExcluded ? (
                                                        <div className="text-xs text-text-muted">{t('common:labels.alreadyAdded', 'Ekli')}</div>
                                                    ) : showPrices && price > 0 ? (
                                                        <div className="font-semibold">{formatPrice(price, native)}</div>
                                                    ) : showPrices ? (
                                                        <div className="text-xs text-text-muted">—</div>
                                                    ) : null}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            <button
                                onClick={reset}
                                disabled={submittingKey !== null}
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
}
