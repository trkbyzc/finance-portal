import React from 'react';
import { Activity, Zap, BarChart3 } from 'lucide-react';

export default function CryptoStats({ coins, loading }) {
    if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 h-24 animate-pulse bg-[#131722] rounded-xl"></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#131722] border border-[#2a2e39] p-5 rounded-2xl flex items-center justify-between shadow-lg group hover:border-[#8b5cf6] transition-all">
                <div>
                    <p className="text-[#868993] text-[10px] font-bold uppercase tracking-widest mb-1">Market Hacmi (24s)</p>
                    <h3 className="text-xl font-black text-white">$2.4T</h3>
                </div>
                <div className="w-12 h-12 bg-[#8b5cf6]/10 rounded-xl flex items-center justify-center text-[#8b5cf6]">
                    <Activity size={24} />
                </div>
            </div>

            <div className="bg-[#131722] border border-[#2a2e39] p-5 rounded-2xl flex items-center justify-between shadow-lg group hover:border-[#f59e0b] transition-all">
                <div>
                    <p className="text-[#868993] text-[10px] font-bold uppercase tracking-widest mb-1">BTC Dominansı</p>
                    <h3 className="text-xl font-black text-[#f59e0b]">52.4%</h3>
                </div>
                <div className="w-12 h-12 bg-[#f59e0b]/10 rounded-xl flex items-center justify-center text-[#f59e0b]">
                    <Zap size={24} />
                </div>
            </div>

            <div className="bg-[#131722] border border-[#2a2e39] p-5 rounded-2xl flex items-center justify-between shadow-lg group hover:border-[#10b981] transition-all">
                <div>
                    <p className="text-[#868993] text-[10px] font-bold uppercase tracking-widest mb-1">Aktif Pariteler</p>
                    <h3 className="text-xl font-black text-white">{coins.length}</h3>
                </div>
                <div className="w-12 h-12 bg-[#10b981]/10 rounded-xl flex items-center justify-center text-[#10b981]">
                    <BarChart3 size={24} />
                </div>
            </div>
        </div>
    );
}