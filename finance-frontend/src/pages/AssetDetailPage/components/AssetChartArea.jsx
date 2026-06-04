import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TradingChart from '../../../components/charts/TradingChart/TradingChart.jsx';
import ViopTradingChart from '../../../components/charts/ViopTradingChart/ViopTradingChart.jsx';
import FundTradingChart from '../../../components/charts/FundTradingChart/FundTradingChart.jsx';
// 🚀 İMPORT EKLENDİ: Türk tahvili olup olmadığını kontrol etmek için
import { isTurkishBond } from '../../../components/charts/TradingChart/utils/symbolUtils';

const GLOBAL_ETFS = ["SPY", "GLD", "TLT", "VNQ", "DIA", "IWM", "VTI", "VOO", "HYG", "LQD", "BND", "AGG", "IEF", "SHY"];

export default function AssetChartArea({ asset, isViop }) {
    const { t } = useTranslation(['asset', 'common']);
    const [fullscreen, setFullscreen] = useState(false);

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

    // Tam ekranda body scroll'u kilitle + Esc ile çık
    useEffect(() => {
        if (!fullscreen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false); };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [fullscreen]);

    const chart = isViop ? (
        <ViopTradingChart asset={asset} theme="dark" />
    ) : isGlobalEtf ? (
        // Küresel Tahvil / ETF ise STOCK/BOND neyse onu gönder
        <TradingChart asset={{ ...asset, chartType: 'CANDLE', assetCategory: finalCategory }} theme="dark" />
    ) : (asset?.assetCategory === 'FUND') ? (
        <FundTradingChart asset={asset} />
    ) : (
        // 🚀 TÜRK TAHVİLİ ise artık assetCategory'si TR_BOND olarak gidiyor!
        <TradingChart asset={{ ...asset, assetCategory: finalCategory }} theme="dark" />
    );

    return (
        <div className={fullscreen ? 'fixed inset-0 z-200 bg-bg p-2 md:p-4 flex' : 'relative mb-8'}>
            <div
                className={`bg-surface border border-border shadow-2xl overflow-hidden relative ${
                    fullscreen ? 'rounded-2xl flex-1 h-full' : 'rounded-3xl p-1 h-[650px]'
                }`}
            >
                <button
                    type="button"
                    onClick={() => setFullscreen(f => !f)}
                    title={fullscreen ? t('asset:chart.exitFullscreen', 'Tam ekrandan çık') : t('asset:chart.fullscreen', 'Tam ekran')}
                    aria-label={fullscreen ? t('asset:chart.exitFullscreen', 'Tam ekrandan çık') : t('asset:chart.fullscreen', 'Tam ekran')}
                    className="absolute bottom-3 right-3 z-30 w-9 h-9 flex items-center justify-center rounded-lg bg-surface-2/90 border border-border text-text-muted hover:text-text hover:bg-surface-hover backdrop-blur transition-colors shadow"
                >
                    {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                {chart}
            </div>
        </div>
    );
}
