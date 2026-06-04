import { useTranslation } from 'react-i18next';

/**
 * Mode (%/fiyat) + currency (TRY/USD) + enflasyon overlay'leri + tarih aralığı butonları.
 */
export default function ComparisonControls({
    mode, setMode,
    currency, setCurrency,
    trInflationActive, toggleTrInflation,
    usdInflationActive, toggleUsdInflation,
    range, setRange,
    isTrBond
}) {
    const { t } = useTranslation(['common', 'charts']);
    const currencySymbol = currency === 'TRY' ? '₺' : '$';
    const comparisonRanges = isTrBond ? ['ytd'] : ['1mo', '3mo', '6mo', '1y', '5y'];

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Mode toggle */}
            <div className="flex items-center bg-surface-2 rounded-lg p-1 border border-border">
                <button
                    onClick={() => setMode('percent')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                        mode === 'percent' ? 'bg-buy text-text shadow' : 'text-text-muted hover:text-text'
                    }`}
                >
                    % {t('common:labels.change')}
                </button>
                <button
                    onClick={() => setMode('price')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                        mode === 'price' ? 'bg-buy text-text shadow' : 'text-text-muted hover:text-text'
                    }`}
                >
                    {currencySymbol} {t('common:labels.price')}
                </button>
            </div>

            {/* Currency toggle */}
            <div className="flex items-center bg-surface-2 rounded-lg p-1 border border-border">
                <button
                    onClick={() => setCurrency('TRY')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                        currency === 'TRY' ? 'bg-primary text-text shadow' : 'text-text-muted hover:text-text'
                    }`}
                >
                    ₺ TRY
                </button>
                <button
                    onClick={() => setCurrency('USD')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                        currency === 'USD' ? 'bg-primary text-text shadow' : 'text-text-muted hover:text-text'
                    }`}
                >
                    $ USD
                </button>
            </div>

            {/* Enflasyon overlay'leri */}
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleTrInflation}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition border ${
                        trInflationActive
                            ? 'bg-sell text-text border-sell shadow-lg shadow-sell/30'
                            : 'bg-surface-2 text-text border-border hover:border-border-strong'
                    }`}
                >
                    {t('charts:trInflation')}
                </button>
                <button
                    onClick={toggleUsdInflation}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition border ${
                        usdInflationActive
                            ? 'bg-warning text-text border-warning shadow-lg shadow-warning/30'
                            : 'bg-surface-2 text-text border-border hover:border-border-strong'
                    }`}
                >
                    {t('charts:usInflation')}
                </button>
            </div>

            {/* Aralık */}
            <div className="flex bg-surface-2 rounded-lg p-1 border border-border">
                {comparisonRanges.map((val) => (
                    <button
                        key={val}
                        onClick={() => setRange(val)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                            range === val ? 'bg-surface-hover text-text shadow' : 'text-text-muted hover:text-text'
                        }`}
                    >
                        {val === 'ytd' ? 'YTD' : val.replace('mo', 'A').replace('y', 'Y')}
                    </button>
                ))}
            </div>
        </div>
    );
}
