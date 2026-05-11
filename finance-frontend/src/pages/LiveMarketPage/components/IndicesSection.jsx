import React from 'react';
import { formatIndexName } from '../LiveMarketUtils';

export default function IndicesSection({ indices, selectedSymbol, setSelectedSymbol }) {
    return (
        <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 text-[#d1d4dc]">Endeksler</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                {indices.map((idx, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedSymbol(idx.symbol)}
                        className={`min-w-[260px] p-5 rounded-2xl border transition-all duration-300 text-left ${selectedSymbol === idx.symbol ? 'bg-[#1e222d] border-[#2962ff] ring-1 ring-[#2962ff]' : 'bg-[#131722] border-[#2a2e39] hover:border-[#868993]'}`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-[#868993] uppercase tracking-wider">{formatIndexName(idx.symbol)}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${idx.changePercent >= 0 ? 'bg-[#089981]/10 text-[#089981]' : 'bg-[#f23645]/10 text-[#f23645]'}`}>
                                {idx.changePercent > 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
                            </span>
                        </div>
                        <div className="text-2xl font-mono font-bold tracking-tight">
                            {idx.price.toLocaleString('tr-TR')} <span className="text-xs text-[#787b86] ml-1">TRY</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}