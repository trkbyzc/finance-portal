import React from 'react';

export const COMMODITY_CATEGORIES = {
    'Tümü': [],
    'Kıymetli Madenler': ['GC=F', 'SI=F', 'PL=F', 'PA=F'],
    'Enerji': ['CL=F', 'BZ=F', 'NG=F'],
    'Sanayi Metalleri': ['HG=F'],
    'Tarım': ['ZW=F', 'ZC=F', 'KC=F', 'CC=F', 'CT=F']
};

export default function MarketCategoryTabs({ activeTab, setActiveTab }) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
            {Object.keys(COMMODITY_CATEGORIES).map((cat) => (
                <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                        activeTab === cat
                            ? 'bg-[#2962ff] text-white shadow-[0_0_15px_rgba(41,98,255,0.3)]'
                            : 'bg-[#131722] text-[#868993] border border-[#2a2e39] hover:text-white hover:border-[#868993]'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}