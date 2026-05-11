import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';

export default function MarketHeader({ title, searchTerm, setSearchTerm, navigate }) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[#868993] hover:text-white mb-4 transition bg-[#1e222d] px-3 py-1.5 rounded-lg border border-[#2a2e39] text-sm"
                >
                    <ArrowLeft size={16} /> Geri Dön
                </button>
                <h1 className="text-3xl font-black uppercase text-white tracking-tight">{title}</h1>
            </div>
            <div className="relative w-full md:w-72">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868993]" />
                <input
                    type="text"
                    placeholder="Sembol veya isim ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#1e222d] border border-[#2a2e39] rounded-xl outline-none text-sm text-white focus:border-[#2962ff] transition"
                />
            </div>
        </div>
    );
}