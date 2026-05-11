import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft } from 'lucide-react';
import { getFlagUrl } from '../../../../../utils/currencyUtils.js';

export default function MajorCurrencyCards({ currencies, loading, show }) {
    const navigate = useNavigate();
    if (loading || !show) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {currencies.map(major => {
                const selling = major.forexSelling || major.price || 0;
                const change = major.changePercent || major.regularMarketChangePercent || 0;
                const isPositive = change > 0;
                return (
                    <div key={major.currencyCode} onClick={() => navigate(`/chart/${major.currencyCode}`)} className="bg-[#131722] border border-[#2a2e39] rounded-2xl p-6 hover:border-[#10b981] transition-all cursor-pointer group relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#2a2e39] group-hover:border-[#10b981] transition shadow-lg shrink-0">
                                    <img src={getFlagUrl(major.currencyCode)} alt="flag" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white group-hover:text-[#10b981] transition">{major.currencyCode}/TRY</h3>
                                    <p className="text-[10px] text-[#868993] uppercase font-bold tracking-wider">{major.currencyName}</p>
                                </div>
                            </div>
                            <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${isPositive ? 'bg-[#089981]/10 text-[#089981]' : 'bg-[#f23645]/10 text-[#f23645]'}`}>
                                {isPositive ? '+' : ''}{change.toFixed(2)}%
                            </div>
                        </div>
                        <div className="flex items-center justify-between relative z-10 bg-[#1e222d] rounded-xl p-4 border border-[#2a2e39]">
                            <div className="flex flex-col">
                                <span className="text-[#868993] text-[10px] font-bold uppercase mb-1">Alış</span>
                                <span className="text-lg font-mono font-bold text-white">₺{(major.forexBuying || major.price || 0).toFixed(4)}</span>
                            </div>
                            <ArrowRightLeft size={16} className="text-[#2a2e39]" />
                            <div className="flex flex-col items-end">
                                <span className="text-[#868993] text-[10px] font-bold uppercase mb-1">Satış</span>
                                <span className="text-lg font-mono font-bold text-[#10b981]">₺{selling.toFixed(4)}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}