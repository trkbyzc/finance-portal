import React from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import TradingChart from '../../../components/charts/TradingChart/TradingChart.jsx';
import ComparisonSection from './ComparisonSection.jsx';

export default function BondDetailView({ asset, trBondsList, decodedSymbol, navigate }) {
    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-6 lg:p-10">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[#868993] hover:text-white mb-6 transition bg-[#1e222d] px-4 py-2 rounded-lg border border-[#2a2e39] hover:border-[#868993] w-fit"
            >
                <ArrowLeft size={18} /> Geri Dön
            </button>

            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                <img src="https://flagcdn.com/w80/tr.png" alt="TR" className="w-20 h-20 rounded-full object-cover border-4 border-[#2a2e39] shadow-lg shrink-0" />
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                        {asset.name || 'Türkiye Devlet Tahvili'} Getiri
                    </h1>
                    <div className="flex flex-wrap items-end gap-6 md:gap-10 mt-3">
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl md:text-5xl font-mono font-bold text-[#089981]">
                                    {Number(asset.yield || 0).toFixed(3)}%
                                </span>
                            </div>
                            <span className="text-[#868993] text-sm font-bold uppercase tracking-widest mt-1 block">Getiri</span>
                        </div>
                        <div className="hidden md:block w-[1px] h-12 bg-[#2a2e39] mb-2"></div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl md:text-3xl font-mono font-bold text-[#d1d4dc]">100.000</span>
                                <span className="text-[#868993] font-bold text-sm">% par</span>
                            </div>
                            <span className="text-[#868993] text-sm font-bold uppercase tracking-widest mt-1 block">Fiyat</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 bg-[#131722] border border-[#2a2e39] rounded-3xl p-1 h-[600px] shadow-2xl overflow-hidden flex flex-col">
                    <TradingChart asset={asset} theme="dark" />
                </div>
                <div className="bg-[#131722] border border-[#2a2e39] rounded-3xl p-6 shadow-2xl flex flex-col h-[600px]">
                    <h3 className="text-lg font-bold text-white mb-4 pb-4 border-b border-[#2a2e39] flex items-center gap-2">
                        <Info size={18} className="text-[#2962ff]" /> Vadeler Listesi
                    </h3>
                    <div className="flex-1 overflow-y-auto hide-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="text-[#868993] text-[11px] uppercase tracking-wider border-b border-[#2a2e39]">
                                <th className="pb-3 font-bold w-1/3">Sembol</th>
                                <th className="pb-3 font-bold w-1/3">Süre</th>
                                <th className="pb-3 font-bold text-right w-1/3">Vade Tarihi</th>
                            </tr>
                            </thead>
                            <tbody>
                            {trBondsList.map((bond, i) => {
                                const isSelected = bond.symbol === decodedSymbol;
                                const shortSymbol = bond.symbol.replace('TP.', '').replace('.ORAN', '');
                                return (
                                    <tr key={i} onClick={() => navigate(`/chart/${encodeURIComponent(bond.symbol)}?cat=TR_BOND`)} className={`border-b border-[#2a2e39]/50 cursor-pointer transition-colors group ${isSelected ? 'bg-[#2962ff]/20' : 'hover:bg-[#1e222d]'}`}>
                                        <td className="py-4"><span className={`font-bold text-[12px] ${isSelected ? 'text-[#2962ff]' : 'text-[#d1d4dc] group-hover:text-white'}`}>{shortSymbol}</span></td>
                                        <td className="py-4 text-[12px] text-[#868993] font-medium">{bond.label}</td>
                                        <td className="py-4 text-[12px] text-right text-[#868993] font-mono">{bond.maturityDate}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="mt-8">
                <ComparisonSection asset={asset} baseSymbol={asset.symbol} />
            </div>
        </div>
    );
}