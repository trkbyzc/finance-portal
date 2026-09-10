import { useEffect, useState } from 'react';
import { X, Tag, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PALETTE } from '../whatIfHelpers';
import { fetchPriceOnDate } from '../../../utils/historicalPrice';

/**
 * Karşılaştırma formunda tek bir asset'in chip'i. Tutar modunda inline horizontal,
 * Miktar modunda vertical (altında quantity input). Renk PALETTE[idx]'ten gelir.
 * investmentDate verildiğinde o tarihteki fiyat chip altında gösterilir.
 */
export default function WhatIfAssetChip({ asset, idx, inputMode, investmentDate, onRemove, onQuantityChange }) {
    const { t } = useTranslation(['whatIf', 'common']);
    const color = PALETTE[idx % PALETTE.length];
    const isQuantityMode = inputMode === 'quantity';
    const [datePrice, setDatePrice] = useState(null); // null=yok, false=bulunamadı, number=fiyat
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        if (!investmentDate || !asset?.symbol) { setDatePrice(null); return; }
        setLoading(true);
        fetchPriceOnDate(asset.symbol, asset.assetType, investmentDate)
            .then(p => { if (!cancelled) setDatePrice(p != null && p > 0 ? p : false); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [investmentDate, asset?.symbol, asset?.assetType]);

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
            {(loading || datePrice !== null) && (
                <div className={`inline-flex items-center gap-1 text-[11px] ${isQuantityMode ? '' : 'ml-1'}`}>
                    {loading ? (
                        <Loader2 className="animate-spin text-text-muted" size={11} />
                    ) : datePrice ? (
                        <span className="text-primary inline-flex items-center gap-1">
                            <Tag size={11} />{Number(datePrice).toLocaleString('tr-TR', { maximumFractionDigits: 4 })}
                        </span>
                    ) : (
                        <span className="text-text-muted inline-flex items-center gap-1">
                            <Tag size={11} />{t('whatIf:form.datePriceMissing', 'fiyat yok')}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
