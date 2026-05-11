// src/pages/MarketPage/dashboards/GlobalFundsDashboard/GlobalFundsDashboard.jsx
import React from 'react';
import { useMarketData } from '../../../../hooks/useMarketData';
import { Globe, TrendingUp, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GlobalFundsDashboard() {
    const navigate = useNavigate();
    const { data: etfs, loading } = useMarketData('global-funds');

    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-6 lg:p-10">
            <div className="mb-10">
                <h1 className="text-3xl font-black uppercase flex items-center gap-3">
                    <span className="w-2 h-8 bg-[#8b5cf6] rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]"></span>
                    Küresel Fonlar (ETF)
                </h1>
                <p className="text-[#868993] text-sm mt-2 ml-5 flex items-center gap-2">
                    <Globe size={16} className="text-[#8b5cf6]" /> Uluslararası Borsa Yatırım Fonları
                </p>
            </div>

            <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1e222d] text-[#868993] text-xs uppercase font-bold">
                    <tr>
                        <th className="p-5">Fon Bilgisi</th>
                        <th className="p-5 text-right">Fiyat</th>
                        <th className="p-5 text-right">Değişim</th>
                        <th className="p-5"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2e39]">
                    {etfs.map((etf, i) => {
                        const symbol = etf.currencyCode || etf.symbol || "";
                        const isPositive = (etf.changePercent || 0) >= 0;

                        return (
                            <tr key={i} onClick={() => navigate(`/chart/${symbol}`)} className="hover:bg-[#1e222d] transition-colors cursor-pointer group">
                                <td className="p-5">
                                    <div className="font-bold text-[#d1d4dc] group-hover:text-white transition">{etf.currencyName || etf.name}</div>
                                    <div className="text-[10px] text-[#868993] font-mono">{symbol}</div>
                                </td>
                                <td className="p-5 text-right font-mono text-white">
                                    ${Number(etf.forexBuying || etf.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className={`p-5 text-right font-bold ${isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                    {isPositive ? '+' : ''}{etf.changePercent}%
                                </td>
                                <td className="p-5 text-right text-[#868993] group-hover:text-[#8b5cf6] transition">
                                    <ChevronRight size={18} />
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