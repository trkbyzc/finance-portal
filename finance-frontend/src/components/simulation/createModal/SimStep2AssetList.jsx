import React, { useMemo, useState } from 'react';
import { Search, ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../../config/apiClient';
import { SIM_ASSET_TYPES } from './simAssetTypes';

export default function SimStep2AssetList({ selectedType, onSelect, onBack }) {
    const { t } = useTranslation(['simulation', 'common']);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: assets, isLoading } = useQuery({
        queryKey: ['assets', selectedType],
        queryFn: async () => {
            if (!selectedType) return [];
            const cfg = SIM_ASSET_TYPES.find(at => at.uiKey === selectedType);
            if (!cfg) return [];
            return apiClient.get(cfg.endpoint);
        },
        enabled: !!selectedType
    });

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return (assets || []).filter(a => {
            const sym = (a.symbol || '').toLowerCase();
            const name = (a.name || '').toLowerCase();
            const code = (a.currencyCode || '').toLowerCase();
            return sym.includes(q) || name.includes(q) || code.includes(q);
        });
    }, [assets, searchTerm]);

    return (
        <div>
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
            <div className="max-h-80 overflow-y-auto space-y-2">
                {isLoading ? (
                    <div className="text-center py-8 text-text-muted">{t('common:status.loading')}</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-8 text-text-muted">{t('common:status.noResults')}</div>
                ) : filtered.map((asset, idx) => {
                    const symbol = asset.symbol || asset.currencyCode;
                    const name = asset.name || asset.currencyName;
                    const price = asset.price || asset.forexSelling || asset.value || asset.lastPrice || asset.unitPrice || 0;
                    return (
                        <button
                            key={idx}
                            onClick={() => onSelect(asset)}
                            className="w-full p-3 bg-bg hover:bg-surface-hover border border-border hover:border-primary rounded-lg text-left flex justify-between items-center transition"
                        >
                            <div>
                                <div className="font-semibold">{name || symbol}</div>
                                <div className="text-xs text-text-muted font-mono">{symbol}</div>
                            </div>
                            <div className="text-right">
                                {price > 0 ? (
                                    <div className="font-semibold">{Number(price).toFixed(2)} ₺</div>
                                ) : (
                                    <div className="text-xs text-text-muted">-</div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
            <button
                onClick={onBack}
                className="mt-4 w-full px-4 py-2 bg-surface-hover hover:bg-surface-hover/80 rounded-lg font-semibold transition inline-flex items-center justify-center gap-2"
            >
                <ChevronLeft size={16} /> {t('simulation:modal.stepBack')}
            </button>
        </div>
    );
}
