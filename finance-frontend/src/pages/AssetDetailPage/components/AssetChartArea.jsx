import React from 'react';
import TradingChart from '../../../components/charts/TradingChart/TradingChart.jsx';
import ViopTradingChart from '../../../components/charts/ViopTradingChart/ViopTradingChart.jsx';
import FundTradingChart from '../../../components/charts/FundTradingChart/FundTradingChart.jsx';

// 🚀 Backend'de güncellediğimiz ETF'leri burada da güncelledik (Tahviller dahil)
const GLOBAL_ETFS = ["SPY", "GLD", "TLT", "VNQ", "DIA", "IWM", "VTI", "VOO", "HYG", "LQD", "BND", "AGG", "IEF", "SHY"];

export default function AssetChartArea({ asset, isViop }) {
    const isGlobalEtf = GLOBAL_ETFS.includes(asset?.symbol?.toUpperCase() || "");

    return (
        <div className="bg-[#131722] border border-[#2a2e39] rounded-3xl p-1 h-[650px] shadow-2xl mb-8 overflow-hidden">
            {isViop ? (
                <ViopTradingChart asset={asset} theme="dark" />
            ) : isGlobalEtf ? (
                <TradingChart asset={{...asset, chartType: 'CANDLE', assetCategory: 'STOCK'}} theme="dark" />
            ) : (asset?.assetCategory === 'FUND') ? (
                <FundTradingChart asset={asset} />
            ) : (
                <TradingChart asset={asset} theme="dark" />
            )}
        </div>
    );
}