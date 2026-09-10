import DistributionDonut from './charts/DistributionDonut';
import PnlBarChart from './charts/PnlBarChart';

/* groupBy: Tümü tab'ında 'assetType', varlık detay tab'ında 'symbol'.
   parentAssetType yalnızca symbol modunda donut renk paleti türetmek için gereklidir. */
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
