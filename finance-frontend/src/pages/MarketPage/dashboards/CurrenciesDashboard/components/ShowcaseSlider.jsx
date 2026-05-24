import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../../../utils/formatters/numberFormatter';

export default function ShowcaseSlider({ showcaseAssets, selectedAsset, setSelectedAsset }) {
    const { t } = useTranslation('common');
    if (!showcaseAssets || showcaseAssets.length === 0) return null;

    return (
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
            {showcaseAssets.map((asset, i) => {
                const symbol = asset.symbol || asset.currencyCode;
                const isSelected = selectedAsset && (selectedAsset.symbol === asset.symbol || selectedAsset.currencyCode === asset.currencyCode);
                const isFund = asset.assetCategory === 'FUND';

                return (
                    <button
                        key={i}
                        onClick={() => setSelectedAsset(asset)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all shrink-0 min-w-[220px] ${
                            isSelected ? 'bg-surface-2 border-primary shadow-[0_0_20px_rgba(41,98,255,0.15)]' : 'bg-surface border-border hover:border-border-strong'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center font-bold text-xs uppercase text-text-muted">
                            {symbol.substring(0, 2)}
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold flex items-center gap-1 uppercase">
                                {symbol.replace('-USD', '').replace('.IS', '')}
                            </div>
                            <div className="text-xs font-mono flex items-center">
                                {isFund ? (
                                    <span className="text-text-muted font-sans mr-2 text-[10px] uppercase">{t('labels.performance')}</span>
                                ) : (
                                    <span>{formatNumber(asset.price || asset.forexSelling)}</span>
                                )}

                                <span className={`ml-2 font-bold px-1 rounded ${asset.changePercent >= 0 ? 'text-buy bg-buy/10' : 'text-sell bg-sell/10'}`}>
                                    {asset.changePercent > 0 ? '+' : ''}{(asset.changePercent || 0).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
