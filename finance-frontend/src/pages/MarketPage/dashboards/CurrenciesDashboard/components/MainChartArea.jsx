import { useTranslation } from 'react-i18next';
import TradingChart from '../../../../../components/charts/TradingChart/TradingChart.jsx';
import ViopTradingChart from '../../../../../components/charts/ViopTradingChart/ViopTradingChart.jsx';
import FundTradingChart from '../../../../../components/charts/FundTradingChart/FundTradingChart.jsx';

export default function MainChartArea({ selectedAsset, category }) {
    const { t } = useTranslation('charts');
    return (
        <div className="px-8 mt-6">
            <div className="bg-surface border border-border rounded-3xl p-1 h-[650px] shadow-2xl overflow-hidden">
                {selectedAsset ? (
                    selectedAsset.assetCategory === 'VIOP' ? (
                        <ViopTradingChart key={selectedAsset.symbol} asset={selectedAsset} theme="dark" />
                    ) : category === 'global-funds' ? (
                        // Global fon sembolleri TradingChart'ta STOCK olarak işlenmeli; aksi hâlde grafik endpoint yanlış kategoriyle çağrılır.
                        <TradingChart key={selectedAsset.symbol} asset={{...selectedAsset, chartType: 'CANDLE', assetCategory: 'STOCK'}} theme="dark" />
                    ) : category === 'tr-funds' ? (
                        <FundTradingChart key={selectedAsset.symbol} asset={selectedAsset} />
                    ) : (
                        <TradingChart key={selectedAsset.symbol} asset={selectedAsset} theme="dark" />
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                        {t('status.noData')}
                    </div>
                )}
            </div>
        </div>
    );
}
