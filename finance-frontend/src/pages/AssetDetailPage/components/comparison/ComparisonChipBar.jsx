import { X, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COMPARISON_COLORS } from './comparisonHelpers';
import ComparisonAssetSearch from './ComparisonAssetSearch';

/**
 * Başlık + currency rozetı + birincil chip + karşılaştırma chip'leri + asset arama dropdown'u.
 */
export default function ComparisonChipBar({
    asset, primaryYahoo, primaryLabel, comparisonAssets,
    currency, isPriceMode, allAssets, onAdd, onRemove
}) {
    const { t } = useTranslation(['asset']);
    const currencySymbol = currency === 'TRY' ? '₺' : '$';

    return (
        <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
                <BarChart2 className="text-primary" /> {t('asset:comparison.title')} {isPriceMode ? `(${currencySymbol})` : '(%)'}
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border text-text border-border bg-surface-2">
                    {currency}
                </span>
            </h2>

            <div className="flex items-center gap-2 ml-2 flex-wrap">
                <div
                    className="px-3 py-1 bg-primary/20 text-primary border border-primary/50 rounded-md text-sm font-bold uppercase truncate max-w-40"
                    title={`${primaryYahoo} · ${primaryLabel}`}
                >
                    {asset?.symbol || primaryYahoo.replace('.IS', '').replace('-USD', '')}
                </div>

                {comparisonAssets.map((ast, i) => (
                    <div
                        key={ast.yahooSymbol}
                        className="flex items-center gap-1.5 px-2 py-1 bg-surface-hover text-text rounded-md text-sm cursor-pointer hover:bg-sell/20 group transition border border-border"
                        title={`${ast.yahooSymbol} · ${ast.label}`}
                    >
                        <span
                            style={{ color: COMPARISON_COLORS[(i + 1) % COMPARISON_COLORS.length] }}
                            className="font-bold uppercase truncate max-w-28"
                        >
                            {ast.yahooSymbol || ast.symbol}
                        </span>
                        <X size={14} className="text-text-muted group-hover:text-sell" onClick={() => onRemove(ast.yahooSymbol)} />
                    </div>
                ))}

                <ComparisonAssetSearch
                    allAssets={allAssets}
                    primaryYahoo={primaryYahoo}
                    comparisonAssets={comparisonAssets}
                    onAdd={onAdd}
                />
            </div>
        </div>
    );
}
