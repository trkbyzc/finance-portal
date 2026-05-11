import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, DollarSign } from 'lucide-react';
import { getFlagUrl } from '../../../../../utils/currencyUtils.js';

export default function CurrencyTable({ data, loading }) {
    const navigate = useNavigate();
    if (loading) return <div className="h-96 animate-pulse bg-[#131722] border border-[#2a2e39] rounded-2xl"></div>;

    return (
        <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#2a2e39] bg-[#1e222d]/50">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <DollarSign className="text-[#10b981]" size={20} /> Tüm Çapraz Kurlar
                </h2>
            </div>
            <div className="overflow-x-auto max-h-[700px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1e222d] sticky top-0 z-10 shadow-md">
                    <tr>
                        <th className="p-5 text-xs font-bold text-[#868993] uppercase tracking-wider">Para Birimi</th>
                        <th className="p-5 text-xs font-bold text-[#868993] uppercase tracking-wider text-right">Döviz Alış</th>
                        <th className="p-5 text-xs font-bold text-[#868993] uppercase tracking-wider text-right">Döviz Satış</th>
                        <th className="p-5"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2e39]">
                    {data.map((currency) => {
                        const code = currency.currencyCode || currency.symbol;
                        return (
                            <tr key={code} onClick={() => navigate(`/chart/${code}`)} className="hover:bg-[#1e222d] transition cursor-pointer group">
                                <td className="p-5 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2a2e39] shrink-0">
                                        <img src={getFlagUrl(code)} alt="flag" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-[#d1d4dc] group-hover:text-white transition tracking-tight">{code}</div>
                                        <div className="text-[10px] text-[#868993] uppercase truncate max-w-[200px]">{currency.currencyName}</div>
                                    </div>
                                </td>
                                <td className="p-5 text-right font-mono font-medium text-[#868993]">₺{(currency.forexBuying || currency.price || 0).toFixed(4)}</td>
                                <td className="p-5 text-right font-mono font-medium text-white group-hover:text-[#10b981]">₺{(currency.forexSelling || currency.price || 0).toFixed(4)}</td>
                                <td className="p-5 text-right"><ChevronRight size={18} className="text-[#868993] group-hover:text-[#10b981]" /></td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}