import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../../config/apiClient';
import { useCurrency } from '../../../context/CurrencyContext';
import { nativeCurrencyForType } from '../../../utils/currencyConversion';
import { PORTFOLIO_ASSET_TYPES } from './portfolioAssetTypes';

// FUND varlıklarında backend fiyatı 0 döndürebilir; parent bunu step-3 geçişinde ayrı fetch ile tamamlar.
export default function Step2AssetList({ selectedType, onSelect, onBack, fetchingPrice }) {
    const { t } = useTranslation(['portfolio', 'common']);
    const { formatNative } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: assets, isLoading } = useQuery({
        queryKey: ['assets', selectedType],
        queryFn: async () => {
            if (!selectedType) return [];
            const typeConfig = PORTFOLIO_ASSET_TYPES.find(at => at.uiKey === selectedType);
            if (!typeConfig) return [];
            return apiClient.get(typeConfig.endpoint);
        },
        enabled: !!selectedType
    });

    const filteredAssets = useMemo(() => {
        if (!assets) return [];
        const q = searchTerm.toLowerCase();
        return assets.filter(asset => {
            const symbol = asset.symbol?.toLowerCase() || '';
            const name = asset.name?.toLowerCase() || '';
            const currencyCode = asset.currencyCode?.toLowerCase() || '';
            return symbol.includes(q) || name.includes(q) || currencyCode.includes(q);
        });
    }, [assets, searchTerm]);

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">{t('portfolio:modal.selectAsset')}</h3>

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
                {isLoading ? (
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
                        const native = nativeCurrencyForType(selectedType, asset?.symbol || asset?.currencyCode);
                        return (
                            <button
                                key={idx}
                                onClick={() => onSelect(asset)}
                                disabled={fetchingPrice}
                                className="w-full p-3 bg-bg hover:bg-surface-hover border border-border hover:border-primary rounded-lg transition text-left flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex-1">
                                    <div className="font-semibold">{symbol}</div>
                                    <div className="text-sm text-text-muted">{name}</div>
                                </div>
                                <div className="text-right">
                                    {isFund && !hasPriceData ? (
                                        <div className="text-xs text-primary">{t('common:actions.select')} →</div>
                                    ) : hasPriceData ? (
                                        <div className="font-semibold">{formatNative(price, native)}</div>
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
                onClick={onBack}
                className="mt-4 w-full px-4 py-2 bg-surface-hover hover:bg-surface-hover rounded font-semibold transition"
            >
                ← {t('common:actions.back')}
            </button>
        </div>
    );
}
