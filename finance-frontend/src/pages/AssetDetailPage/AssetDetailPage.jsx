import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAssetDetails } from '../../hooks/useAssetDetails';

// 🚀 LOKAL BİLEŞENLER (Sadece bu sayfaya özel)
import AssetHeader from './components/AssetHeader';
import AssetChartArea from './components/AssetChartArea';
import BondDetailView from './components/BondDetailView';
import ComparisonSection from './components/ComparisonSection';

export default function AssetDetailPage() {
    const { symbol } = useParams();
    const navigate = useNavigate();

    const { asset, trBondsList, loading, isTrBond, isViop, decodedSymbol } = useAssetDetails(symbol);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#0b0e14]">
            <Loader2 className="animate-spin text-[#2962ff]" size={48} />
        </div>
    );

    // 🚀 TAHVİL ÖZEL GÖRÜNÜMÜ: Eğer tahvilse, lokalden çektiğimiz görünüme pasla
    if (isTrBond && asset) {
        return <BondDetailView asset={asset} trBondsList={trBondsList} decodedSymbol={decodedSymbol} navigate={navigate} />;
    }

    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-6 lg:p-10">
            {/* 1. Üst Başlık ve Geri Butonu (Lokal) */}
            <AssetHeader asset={asset} navigate={navigate} />

            {/* 2. Dinamik Grafik Alanı (Lokal - İçinde Global grafik motorlarını çağırıyor) */}
            <AssetChartArea asset={asset} isViop={isViop} />

            {/* 3. Kıyaslama Bölümü (Lokal) */}
            <ComparisonSection asset={asset} baseSymbol={asset?.yahooSymbol || asset?.symbol} />
        </div>
    );
}