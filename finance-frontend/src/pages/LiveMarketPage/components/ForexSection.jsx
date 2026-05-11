import React from 'react';
import { Globe } from 'lucide-react';
import { getFlagUrl, getHeatmapClass } from '../LiveMarketUtils';

export default function ForexSection({ sortedForexList, onSelect }) {
    return (
        <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                Foreks ve para birimleri <Globe className="text-[#868993]" size={24} />
            </h2>
            <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                        <tr className="border-b border-[#2a2e39] text-[#868993] text-[13px] bg-[#0b0e14]">
                            <th className="p-4 font-normal tracking-wide sticky left-0 bg-[#0b0e14] z-10 w-48">Döviz Çifti</th>
                            <th className="p-4 font-normal text-right tracking-wide w-32">Fiyat</th>
                            <th className="p-4 font-normal text-center tracking-wide border-l border-[#2a2e39] w-24">Bugün</th>
                            <th className="p-4 font-normal text-center tracking-wide border-l border-[#2a2e39] w-24">Hafta</th>
                            <th className="p-4 font-normal text-center tracking-wide border-l border-[#2a2e39] w-24">Ay</th>
                            <th className="p-4 font-normal text-center tracking-wide border-l border-[#2a2e39] w-24">6 ay</th>
                            <th className="p-4 font-normal text-center tracking-wide border-l border-[#2a2e39] w-24">Yıl</th>
                            <th className="p-4 font-normal text-center tracking-wide border-l border-[#2a2e39] w-24">5 yıl</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedForexList.map((currency, i) => (
                            <tr key={i} onClick={() => onSelect(currency.yahooSymbol)} className="border-b border-[#2a2e39]/50 hover:bg-[#1e222d] transition-colors group cursor-pointer">
                                <td className="p-4 font-bold flex items-center gap-3 sticky left-0 bg-[#131722] group-hover:bg-[#1e222d] transition-colors z-10">
                                    <img src={getFlagUrl(currency.currencyCode)} alt={currency.currencyCode} className="w-6 h-6 rounded-full object-cover shadow-md border border-[#2a2e39]"/>
                                    <div className="flex flex-col">
                                        <span className="text-[#d1d4dc] text-[15px] group-hover:text-[#2962ff] transition-colors">{currency.currencyCode}<span className="text-[#868993] font-normal">:TRY</span></span>
                                    </div>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-[#d1d4dc] text-[15px]">
                                    {currency.forexSelling.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                                </td>
                                <td className={`p-4 text-center font-mono font-bold text-[13px] border-l border-[#2a2e39]/30 transition-colors ${getHeatmapClass(currency.changePercent)}`}>
                                    {currency.changePercent > 0 ? '+' : ''}{currency.changePercent?.toFixed(2) ?? '-'}%
                                </td>
                                <td className={`p-4 text-center font-mono font-bold text-[13px] border-l border-[#2a2e39]/30 transition-colors ${getHeatmapClass(currency.changeWeek)}`}>
                                    {currency.changeWeek > 0 ? '+' : ''}{currency.changeWeek?.toFixed(2) ?? '-'}%
                                </td>
                                <td className={`p-4 text-center font-mono font-bold text-[13px] border-l border-[#2a2e39]/30 transition-colors ${getHeatmapClass(currency.changeMonth)}`}>
                                    {currency.changeMonth > 0 ? '+' : ''}{currency.changeMonth?.toFixed(2) ?? '-'}%
                                </td>
                                <td className={`p-4 text-center font-mono font-bold text-[13px] border-l border-[#2a2e39]/30 transition-colors ${getHeatmapClass(currency.change6Month)}`}>
                                    {currency.change6Month > 0 ? '+' : ''}{currency.change6Month?.toFixed(2) ?? '-'}%
                                </td>
                                <td className={`p-4 text-center font-mono font-bold text-[13px] border-l border-[#2a2e39]/30 transition-colors ${getHeatmapClass(currency.changeYear)}`}>
                                    {currency.changeYear > 0 ? '+' : ''}{currency.changeYear?.toFixed(2) ?? '-'}%
                                </td>
                                <td className={`p-4 text-center font-mono font-bold text-[13px] border-l border-[#2a2e39]/30 transition-colors ${getHeatmapClass(currency.change5Year)}`}>
                                    {currency.change5Year > 0 ? '+' : ''}{currency.change5Year?.toFixed(2) ?? '-'}%
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}