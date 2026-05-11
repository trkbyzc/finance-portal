import React from 'react';
import { LayoutGrid, Coins, Droplets, Wheat, Construction } from 'lucide-react';

export default function CommodityTabs({ activeCategory, setActiveCategory }) {
    const tabs = [
        { id: 'all', label: 'Tümü', icon: <LayoutGrid size={18} /> },
        { id: 'precious', label: 'Kıymetli Metaller', icon: <Coins size={18} /> },
        { id: 'energy', label: 'Enerji', icon: <Droplets size={18} /> }, // Enerji Kategorisi
        { id: 'agriculture', label: 'Tarım', icon: <Wheat size={18} /> }, // Tarım Kategorisi
        { id: 'industrial', label: 'Sanayi Metalleri', icon: <Construction size={18} /> }, // Sanayi Metalleri
    ];

    return (
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all whitespace-nowrap text-xs font-bold uppercase tracking-wider
                        ${activeCategory === tab.id
                        ? 'bg-[#fbbf24]/10 border-[#fbbf24] text-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                        : 'bg-[#131722] border-[#2a2e39] text-[#868993] hover:border-[#fbbf24]/50 hover:text-white'
                    }`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}