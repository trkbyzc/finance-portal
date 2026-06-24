import { useMemo } from 'react';
import { useComparisonData } from '../../../hooks/useComparisonData.js';
import { useCurrency } from '../../../context/CurrencyContext';
import ComparisonChipBar from './comparison/ComparisonChipBar';
import ComparisonControls from './comparison/ComparisonControls';
import ComparisonChart from './comparison/ComparisonChart';

// useComparisonData stabil referans beklediği için asset prop'undan türetilen değerler memoize edilir.
export default function ComparisonSection({ asset, baseSymbol }) {
    const { primaryYahoo, primaryLabel, isTrBond, primaryCategory } = useMemo(() => {
        const actualAsset = asset || { yahooSymbol: baseSymbol, name: baseSymbol, symbol: baseSymbol };
        const yahoo = actualAsset.yahooSymbol || actualAsset.symbol || actualAsset.currencyCode || 'XU100.IS';
        const label = actualAsset.name || actualAsset.currencyName || yahoo;
        const bond = yahoo.startsWith('TP.');
        const category = actualAsset.assetCategory || actualAsset.category || 'UNKNOWN';
        return { primaryYahoo: yahoo, primaryLabel: label, isTrBond: bond, primaryCategory: category };
    }, [asset, baseSymbol]);

    const {
        comparisonAssets, addAsset, removeAsset,
        allAssets, chartData, isLoading, range, setRange, allActiveAssets,
        trInflationActive, usdInflationActive, toggleTrInflation, toggleUsdInflation,
        inflationSeries, mode, setMode
    } = useComparisonData(primaryYahoo, primaryLabel, asset?.symbol || baseSymbol, isTrBond, primaryCategory);

    const { currency, setCurrency } = useCurrency();
    const isPriceMode = mode === 'price';

    return (
        <div id="asset-comparison" className="mt-8 scroll-mt-24 bg-surface border border-border rounded-xl p-4 md:p-6 shadow-2xl relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <ComparisonChipBar
                    asset={asset}
                    primaryYahoo={primaryYahoo}
                    primaryLabel={primaryLabel}
                    comparisonAssets={comparisonAssets}
                    currency={currency}
                    isPriceMode={isPriceMode}
                    allAssets={allAssets}
                    onAdd={addAsset}
                    onRemove={removeAsset}
                />
                <ComparisonControls
                    mode={mode}
                    setMode={setMode}
                    currency={currency}
                    setCurrency={setCurrency}
                    trInflationActive={trInflationActive}
                    toggleTrInflation={toggleTrInflation}
                    usdInflationActive={usdInflationActive}
                    toggleUsdInflation={toggleUsdInflation}
                    range={range}
                    setRange={setRange}
                    isTrBond={isTrBond}
                />
            </div>

            <ComparisonChart
                allActiveAssets={allActiveAssets}
                inflationSeries={inflationSeries}
                chartData={chartData}
                isLoading={isLoading}
                isPriceMode={isPriceMode}
                currency={currency}
            />
        </div>
    );
}
