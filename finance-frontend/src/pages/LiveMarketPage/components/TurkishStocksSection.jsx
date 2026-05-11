import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function TurkishStocksSection({ highestVolume, mostVolatile, topGainers, topLosers, onSelect }) {
    return (
        <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                Türk hisseleri <ChevronRight className="text-[#868993]" size={24} />
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12">
                <StockListBlock title="En yüksek hacimli hisse senetleri" data={highestVolume} onSelect={onSelect} />
                <StockListBlock title="En değişken hisseler" data={mostVolatile} onSelect={onSelect} />
                <StockListBlock title="Artan hisseler" data={topGainers} onSelect={onSelect} usePill={true} />
                <StockListBlock title="Azalan hisseler" data={topLosers} onSelect={onSelect} usePill={true} />
            </div>
        </div>
    );
}

function StockListBlock({ title, data, onSelect, usePill = false }) {
    if (!data || data.length === 0) return null;
    return (
        <div className="flex flex-col">
            <h3 className="text-lg font-bold text-[#d1d4dc] mb-4 flex items-center gap-1 group cursor-pointer w-max">
                {title} <ChevronRight size={18} className="text-[#2a2e39] group-hover:text-white transition-colors" />
            </h3>
            <div className="flex flex-col">
                {data.map((item, idx) => {
                    const symbol = item.symbol.replace('.IS', '');
                    const isPositive = item.changePercent >= 0;
                    return (
                        <div key={idx} onClick={() => onSelect(item.symbol)} className="flex items-center justify-between py-3 border-b border-[#2a2e39]/50 hover:bg-[#1e222d] transition-colors cursor-pointer rounded-lg px-2 -mx-2 group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#2a2e39] text-[#868993] flex items-center justify-center font-bold text-sm group-hover:bg-[#2962ff] group-hover:text-white transition-colors">
                                    {symbol.substring(0, 2)}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-[#d1d4dc] group-hover:text-white uppercase">{symbol}</span>
                                        <span className="text-[9px] font-bold text-[#868993] border border-[#2a2e39] px-1 rounded">G</span>
                                    </div>
                                    <span className="text-xs text-[#868993] w-32 md:w-48 truncate">{item.name || symbol}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="font-mono font-bold text-[#d1d4dc]">
                                    {(item.price || item.forexSelling).toLocaleString('tr-TR')} <span className="text-[10px] text-[#787b86]">TRY</span>
                                </span>
                                <span className={`text-[11px] font-bold ${usePill ? 'px-2 py-0.5 rounded text-white ' + (isPositive ? 'bg-[#089981]' : 'bg-[#f23645]') : (isPositive ? 'text-[#089981]' : 'text-[#f23645]')}`}>
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