import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function GoldRow({ gold, onClick }) {
    const sellPrice = gold.price || 0;
    const buyPrice = gold.buyPrice || sellPrice;
    const isPositive = gold.changePercent >= 0;

    return (
        <div
            onClick={onClick}
            className="flex flex-col md:flex-row items-center justify-between bg-[#131722] border border-[#2a2e39] rounded-2xl p-4 md:p-5 shadow-lg hover:border-[#ff9800]/50 hover:bg-[#1e222d] transition-all group cursor-pointer"
        >
            <div className="flex items-center gap-4 w-full md:w-1/3 mb-4 md:mb-0">
                <div className="w-12 h-12 rounded-full bg-[#0b0e14] flex shrink-0 items-center justify-center font-black text-[#ffb74d] border border-[#ff9800]/20 shadow-[0_0_10px_rgba(255,152,0,0.1)]">
                    AU
                </div>
                <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-[#ffb74d] transition-colors">{gold.name}</h3>
                    <span className="text-xs text-[#868993] font-medium">{gold.symbol.replace(/_/g, ' ')}</span>
                </div>
            </div>

            <div className="flex items-center justify-between md:justify-center gap-8 w-full md:w-1/3 bg-[#0b0e14] md:bg-transparent p-3 md:p-0 rounded-xl border border-[#2a2e39] md:border-none mb-4 md:mb-0">
                <div className="flex flex-col text-left md:text-right w-1/2 md:w-auto">
                    <span className="text-[#868993] text-[10px] font-bold uppercase mb-1">Alış (Size Ödenen)</span>
                    <span className="text-lg font-mono font-bold text-white">
                        {buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </span>
                </div>
                <div className="hidden md:block w-px h-10 bg-[#2a2e39]"></div>
                <div className="flex flex-col text-right md:text-left w-1/2 md:w-auto">
                    <span className="text-[#868993] text-[10px] font-bold uppercase mb-1">Satış (Sizin Aldığınız)</span>
                    <span className="text-lg font-mono font-bold text-[#ff9800]">
                        {sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </span>
                </div>
            </div>

            <div className="flex justify-end w-full md:w-1/3">
                <span className={`flex items-center justify-center gap-1 text-sm font-bold px-4 py-2 rounded-xl border w-full md:w-auto ${isPositive ? 'bg-[#089981]/10 text-[#089981] border-[#089981]/20' : 'bg-[#f23645]/10 text-[#f23645] border-[#f23645]/20'}`}>
                    {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {isPositive ? '+' : ''}{(gold.changePercent || 0).toFixed(2)}%
                </span>
            </div>
        </div>
    );
}