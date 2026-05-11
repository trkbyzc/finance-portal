import React from 'react';

export default function NewsCategoryTabs({ categories, activeCategory, setActiveCategory }) {
    return (
        <div className="flex gap-3 overflow-x-auto pb-4 mb-10 scrollbar-hide border-b border-[#2a2e39]">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeCategory === cat ? 'bg-[#2962ff] text-white' : 'bg-[#131722] text-[#868993] hover:bg-[#1c2130]'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}