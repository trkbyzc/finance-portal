import React from 'react';
import { detectCategoryFromSymbol } from '../../../utils/categoryUtils';

export default function MarketTable({ data, navigate, routeCategory }) {
    return (
        <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-[#1e222d] text-[#868993] text-xs uppercase tracking-wider">
                        <th className="p-4 font-bold border-b border-[#2a2e39]">Sembol / İsim</th>
                        <th className="p-4 font-bold border-b border-[#2a2e39] text-right">Fiyat</th>
                        <th className="p-4 font-bold border-b border-[#2a2e39] text-right">Değişim (24S)</th>
                        <th className="p-4 font-bold border-b border-[#2a2e39] text-center">İşlem</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2e39]">
                    {data.map((item, idx) => {
                        const symbol = item.symbol || item.yahooSymbol || item.currencyCode;
                        const cleanSymbol = symbol ? symbol.replace('.IS', '').replace('-USD', '') : 'BİLİNMİYOR';
                        const isPositive = (item.changePercent || 0) >= 0;

                        const cat = item.assetCategory || routeCategory || detectCategoryFromSymbol(symbol);
                        const target = `/chart/${encodeURIComponent(symbol)}${cat ? `?cat=${cat}` : ''}`;
                        return (
                            <tr
                                key={idx}
                                onClick={() => navigate(target)}
                                className="hover:bg-[#1e222d] transition-colors cursor-pointer group"
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#2a2e39] flex items-center justify-center font-bold text-[10px] text-[#868993]">
                                            {cleanSymbol.substring(0, 2)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-white group-hover:text-[#2962ff] transition-colors">{cleanSymbol}</div>
                                            <div className="text-xs text-[#868993] truncate max-w-[200px]">{item.name || item.currencyName}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-right font-mono text-sm text-white">
                                    {(item.price || item.forexSelling)?.toLocaleString('tr-TR')}
                                </td>
                                <td className="p-4 text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${isPositive ? 'bg-[#089981]/10 text-[#089981]' : 'bg-[#f23645]/10 text-[#f23645]'}`}>
                                            {isPositive ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                                        </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="text-[#868993] group-hover:text-[#2962ff] text-xs font-bold transition-all">Grafiği Aç &rarr;</span>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}