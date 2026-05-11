import React from 'react';
import { ArrowLeft, BarChart2, DollarSign } from 'lucide-react';
import { useCurrency } from '../../../context/CurrencyContext';

export default function AssetHeader({ asset, navigate }) {
    const { currency, toggleCurrency, formatPrice } = useCurrency();

    const getInitials = () => {
        if (asset?.currencyCode) return asset.currencyCode.substring(0, 2).toUpperCase();
        if (asset?.symbol) return asset.symbol.replace('TRY=X', '').replace('=X', '').substring(0, 2).toUpperCase();
        return 'XX';
    };

    return (
        <>
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[#868993] hover:text-white mb-6 transition bg-[#1e222d] px-4 py-2 rounded-lg border border-[#2a2e39] hover:border-[#868993] w-fit"
            >
                <ArrowLeft size={18} /> Geri Dön
            </button>

            {/* 🚀 DEĞİŞİKLİK BURADA: justify-between silindi, justify-start ve gap-8 eklendi */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-start gap-8">

                {/* SOL TARAF: LOGO VE İSİM */}
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#2a2e39] flex items-center justify-center font-bold text-[#868993] text-xl uppercase shadow-lg shrink-0">
                        {getInitials()}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase text-white tracking-tight flex items-center gap-3">
                            {asset?.name || asset?.symbol?.replace('-USD','').replace('.IS','')}
                        </h1>
                        <p className="text-[#868993] text-sm flex items-center gap-2 mt-1">
                            <BarChart2 size={14} /> Detaylı Analiz & Performans Karşılaştırması
                        </p>
                    </div>
                </div>

                {/* 🚀 FİYAT KUTUSU ARTIK İSMİN HEMEN YANINDA */}
                {asset?.displayPrice > 0 && (
                    <div className="flex items-center gap-5 bg-[#131722] px-6 py-3 rounded-2xl border border-[#2a2e39] shadow-xl shrink-0">
                        <div className="flex flex-col items-start">
                            <span className="text-[#868993] text-[10px] font-bold uppercase tracking-wider mb-1">Anlık Fiyat</span>
                            <span className="text-3xl font-mono font-black text-white">
                                {formatPrice(asset.displayPrice, asset.nativeCurrency)}
                            </span>
                        </div>

                        {/* TOGGLE BUTONU */}
                        <button
                            onClick={toggleCurrency}
                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#2962ff]/10 hover:bg-[#2962ff]/20 text-[#2962ff] border border-[#2962ff]/30 transition-all shadow-[0_0_15px_rgba(41,98,255,0.15)] group ml-2"
                            title="Para Birimini Değiştir"
                        >
                            {currency === 'TRY' ? (
                                <DollarSign size={24} className="group-hover:scale-110 transition-transform" />
                            ) : (
                                <span className="text-2xl font-bold group-hover:scale-110 transition-transform">₺</span>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}