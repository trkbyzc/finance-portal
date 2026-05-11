import React from 'react';
import { Search, Compass } from 'lucide-react';

export default function CommodityHeader({ searchQuery, setSearchQuery }) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
                <h1 className="text-3xl font-black uppercase text-white tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-[#fbbf24] rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]"></span>
                    Emtia Piyasası
                </h1>
                <p className="text-[#868993] text-sm mt-2 ml-5 flex items-center gap-2">
                    <Compass size={16} className="text-[#fbbf24]" /> Kıymetli Madenler, Enerji ve Tarım
                </p>
            </div>

            {/* Arama Çubuğu */}
            <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868993]" />
                <input
                    type="text"
                    placeholder="Emtia ara (örn: Altın, Gümüş)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#131722] border border-[#2a2e39] focus:border-[#fbbf24] text-white rounded-xl outline-none text-sm transition shadow-lg"
                />
            </div>
        </div>
    );
}