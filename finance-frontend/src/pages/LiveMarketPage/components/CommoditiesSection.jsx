import React from 'react';
import { ChevronRight, Coins } from 'lucide-react';

export default function CommoditiesSection({ commodityCards, onSelect }) {
    return (
        <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                Vadeli işlemler ve emtialar <ChevronRight className="text-[#868993]" size={24} />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {commodityCards.map((item, idx) => {
                    const isPositive = item.changePercent >= 0;
                    return (
                        <div
                            key={idx}
                            onClick={() => onSelect(item.symbol)}
                            className="flex justify-between items-center p-4 border-b border-[#2a2e39] hover:bg-[#131722] transition-colors rounded-lg cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${item.iconColor} shadow-lg`}>
                                    <Coins size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-bold text-[#d1d4dc] group-hover:text-white transition-colors">{item.name}</span>
                                        <span className="text-[9px] font-bold text-[#ff9800] border border-[#ff9800]/30 bg-[#ff9800]/10 px-1 rounded">G</span>
                                    </div>
                                    <span className="text-xs text-[#868993] bg-[#1e222d] px-1.5 py-0.5 rounded w-max mt-1 border border-[#2a2e39]">{item.symbol}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="font-mono font-bold text-[#d1d4dc]">
                                    {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                    <span className="text-[10px] text-[#787b86] ml-1">{item.currency}</span>
                                </span>
                                <span className={`text-[11px] font-bold ${isPositive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                                    {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}