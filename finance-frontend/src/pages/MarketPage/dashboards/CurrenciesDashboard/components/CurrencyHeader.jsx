import React from 'react';
import { Search, Globe } from 'lucide-react';

export default function CurrencyHeader({ searchQuery, setSearchQuery }) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
                <h1 className="text-3xl font-black uppercase text-white tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-[#10b981] rounded-full"></span>
                    Döviz Piyasası
                </h1>
                <p className="text-[#868993] text-sm mt-2 ml-5 flex items-center gap-2">
                    <Globe size={16} className="text-[#10b981]" /> TCMB Güncel Döviz Alış ve Satış Kurları
                </p>
            </div>
            <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868993]" />
                <input
                    type="text"
                    placeholder="Para birimi ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#131722] border border-[#2a2e39] focus:border-[#10b981] text-white rounded-xl outline-none text-sm transition shadow-lg"
                />
            </div>
        </div>
    );
}