import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PALETTE } from '../whatIfHelpers';

/**
 * Karşılaştırma formunda tek bir asset'in chip'i. Tutar modunda inline horizontal,
 * Miktar modunda vertical (altında quantity input). Renk PALETTE[idx]'ten gelir.
 */
export default function WhatIfAssetChip({ asset, idx, inputMode, onRemove, onQuantityChange }) {
    const { t } = useTranslation(['whatIf', 'common']);
    const color = PALETTE[idx % PALETTE.length];
    const isQuantityMode = inputMode === 'quantity';

    return (
        <div
            className={`bg-bg border rounded-lg text-sm ${
                isQuantityMode ? 'px-3 py-2 flex flex-col gap-1.5' : 'px-3 py-1.5 inline-flex items-center gap-2'
            }`}
            style={{ borderColor: color + '60' }}
        >
            <div className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="font-bold">{asset.symbol}</span>
                <span className="text-xs text-text-muted">{t('common:assetTypes.' + asset.assetType, asset.assetType)}</span>
                <button onClick={onRemove} className="text-text-muted hover:text-sell ml-1" aria-label="remove">
                    <X size={14} />
                </button>
            </div>
            {isQuantityMode && (
                <div className="inline-flex items-center gap-1.5 text-xs">
                    <span className="text-text-muted">{t('whatIf:form.qty', 'Miktar')}:</span>
                    <input
                        type="number"
                        value={asset.quantity ?? ''}
                        onChange={(e) => onQuantityChange(e.target.value)}
                        placeholder="1"
                        min="0"
                        step="any"
                        className="w-24 bg-surface-2 border border-border rounded px-2 py-0.5 text-xs focus:outline-none focus:border-primary"
                    />
                </div>
            )}
        </div>
    );
}
