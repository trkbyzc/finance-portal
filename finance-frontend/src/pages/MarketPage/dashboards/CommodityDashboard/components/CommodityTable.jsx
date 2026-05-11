import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    Droplets,
    Flame,
    Wheat,
    Coins,
    Gem,
    Hammer,
    Construction
} from 'lucide-react';

// 🚀 ÜRÜN KODUNA GÖRE İKON SEÇİCİ
const getCommodityIcon = (code) => {
    const c = code.toUpperCase();
    if (c.includes('CL')) return <Droplets className="text-blue-400" size={20} />; // Petrol
    if (c.includes('GC') || c.includes('GA')) return <Coins className="text-[#fbbf24]" size={20} />; // Altın
    if (c.includes('SI') || c.includes('GAG')) return <Gem className="text-gray-400" size={20} />; // Gümüş
    if (c.includes('NG')) return <Flame className="text-orange-500" size={20} />; // Doğalgaz
    if (c.includes('ZW') || c.includes('ZC')) return <Wheat className="text-yellow-600" size={20} />; // Buğday/Mısır
    if (c.includes('HG')) return <Hammer className="text-orange-700" size={20} />; // Bakır
    return <Construction className="text-gray-500" size={20} />; // Diğer
};

export default function CommodityTable({ data, loading }) {
    const navigate = useNavigate();
    if (loading) return <div className="h-96 animate-pulse bg-[#131722] border border-[#2a2e39] rounded-2xl"></div>;

    return (
        <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#2a2e39] bg-[#1e222d]/50 flex items-center gap-3">
                <Coins className="text-[#fbbf24]" size={20} />
                <h2 className="text-lg font-bold text-white tracking-tight">Emtia Piyasası</h2>
            </div>
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1e222d] sticky top-0 z-10 shadow-md">
                    <tr>
                        <th className="p-5 text-xs font-bold text-[#868993] uppercase tracking-wider">Ürün</th>
                        <th className="p-5 text-xs font-bold text-[#868993] uppercase tracking-wider text-right">Alış</th>
                        <th className="p-5 text-xs font-bold text-[#868993] uppercase tracking-wider text-right">Satış</th>
                        <th className="p-5"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2e39]">
                    {data && data.length > 0 ? (
                        data.map((item, index) => {
                            const code = item?.currencyCode || item?.symbol || "";
                            const name = item?.currencyName || item?.name || "Emtia";
                            const buying = item?.forexBuying || item?.price || 0;
                            const selling = item?.forexSelling || item?.price || 0;

                            return (
                                <tr
                                    key={`${code}-${index}`}
                                    onClick={() => code && navigate(`/chart/${code}`)}
                                    className="hover:bg-[#1e222d] transition cursor-pointer group"
                                >
                                    <td className="p-5 flex items-center gap-4">
                                        {/* 🚀 DİNAMİK İKON BURADA */}
                                        <div className="w-10 h-10 rounded-xl bg-[#1a1e29] border border-[#2a2e39] flex items-center justify-center shadow-inner group-hover:border-[#fbbf24] transition-all">
                                            {getCommodityIcon(code)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#d1d4dc] group-hover:text-white transition line-clamp-1">
                                                {name.split(',')[0]} {/* İsimleri biraz kısalttık */}
                                            </div>
                                            <div className="text-[10px] text-[#868993] uppercase font-mono">{code}</div>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right font-mono font-bold text-[#868993]">
                                        ₺{Number(buying).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-5 text-right font-mono font-bold text-white group-hover:text-[#fbbf24]">
                                        ₺{Number(selling).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-5 text-right text-[#868993] group-hover:text-[#fbbf24]">
                                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="4" className="p-10 text-center text-[#868993]">Emtia verisi yüklenemedi.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}