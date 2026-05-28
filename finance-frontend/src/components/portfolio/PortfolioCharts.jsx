import React from 'react';
import DistributionDonut from './charts/DistributionDonut';
import PnlBarChart from './charts/PnlBarChart';

/**
 * Portföy chart paneli — orchestrator. Donut (dağılım) + Bar (P/L) iki kart yan yana.
 *
 * @param {object[]} portfolio
 * @param {function} calculateProfitLoss
 * @param {'assetType'|'symbol'} groupBy — donut grouping modu (Tümü tab'ında 'assetType')
 * @param {string} [parentAssetType] — symbol modunda renk shade'lerinin türetildiği ana tip
 */
export default function PortfolioCharts({ portfolio, calculateProfitLoss, groupBy = 'assetType', parentAssetType }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <DistributionDonut
                portfolio={portfolio}
                calculateProfitLoss={calculateProfitLoss}
                groupBy={groupBy}
                parentAssetType={parentAssetType}
            />
            <PnlBarChart
                portfolio={portfolio}
                calculateProfitLoss={calculateProfitLoss}
            />
        </div>
    );
}
