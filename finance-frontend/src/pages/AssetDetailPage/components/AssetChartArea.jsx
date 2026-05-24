import React from 'react';
import TradingChart from '../../../components/charts/TradingChart/TradingChart.jsx';
import ViopTradingChart from '../../../components/charts/ViopTradingChart/ViopTradingChart.jsx';
import FundTradingChart from '../../../components/charts/FundTradingChart/FundTradingChart.jsx';
// 🚀 İMPORT EKLENDİ: Türk tahvili olup olmadığını kontrol etmek için
import { isTurkishBond } from '../../../components/charts/TradingChart/utils/symbolUtils';

const GLOBAL_ETFS = ["SPY", "GLD", "TLT", "VNQ", "DIA", "IWM", "VTI", "VOO", "HYG", "LQD", "BND", "AGG", "IEF", "SHY"];

export default function AssetChartArea({ asset, isViop }) {
    const isGlobalEtf = GLOBAL_ETFS.includes(asset?.symbol?.toUpperCase() || "");

    // 🚀 MİMARİ KARAR: Eğer bu bir Türk Tahvili ise, kategorisini TR_BOND olarak işaretle!
    // Böylece backend'deki TurkishBondChartStrategy bunu hemen yakalar.
    const isTurkishBondAsset = isTurkishBond(asset?.symbol || "");

    // Kategori mantığını belirle
    const getFinalCategory = () => {
        if (isTurkishBondAsset) return 'TR_BOND';
        if (isGlobalEtf) return 'BOND'; // Küresel tahviller için BOND kalsın
        return asset?.assetCategory;
    };

    const finalCategory = getFinalCategory();

    return (
        <div className="bg-surface border border-border rounded-3xl p-1 h-[650px] shadow-2xl mb-8 overflow-hidden">
            {isViop ? (
                <ViopTradingChart asset={asset} theme="dark" />
            ) : isGlobalEtf ? (
                // Küresel Tahvil / ETF ise STOCK/BOND neyse onu gönder
                <TradingChart asset={{...asset, chartType: 'CANDLE', assetCategory: finalCategory}} theme="dark" />
            ) : (asset?.assetCategory === 'FUND') ? (
                <FundTradingChart asset={asset} />
            ) : (
                // 🚀 TÜRK TAHVİLİ ise artık assetCategory'si TR_BOND olarak gidiyor!
                <TradingChart asset={{...asset, assetCategory: finalCategory}} theme="dark" />
            )}
        </div>
    );
}