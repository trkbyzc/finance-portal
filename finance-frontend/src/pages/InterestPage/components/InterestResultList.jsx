import React from 'react';
import { Building, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function InterestResultList({ results, loading }) {
    const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <Loader2 className="animate-spin text-[#2962ff] mb-4" size={48} />
                <p className="text-[#868993] animate-pulse">Oranlar taranıyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 🏆 EN KAZANÇLI TEKLİF */}
            {results.length > 0 && (
                <div className="bg-gradient-to-br from-[#089981]/20 to-[#131722] border border-[#089981]/50 rounded-2xl p-1 relative overflow-hidden mb-8 shadow-lg">
                    <div className="absolute top-0 right-0 bg-[#089981] text-white text-[10px] font-black px-4 py-1 rounded-bl-xl tracking-wider uppercase">
                        En Kazançlı Teklif
                    </div>
                    <div className="bg-[#131722] rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-[#1e222d] border border-[#2a2e39] rounded-2xl flex items-center justify-center shrink-0">
                                <Building className="text-[#089981]" size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">{results[0].bankName}</h2>
                                <p className="text-[#868993] text-sm">Yıllık Faiz: <strong className="text-white">%{results[0].annualRate.toFixed(2)}</strong></p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end w-full md:w-auto">
                            <span className="text-sm text-[#868993] font-semibold mb-1">Dönem Sonu Net Kazanç</span>
                            <div className="text-4xl font-black text-[#089981]">+₺{formatCurrency(results[0].netYield)}</div>
                            <div className="mt-2 text-xs font-medium text-[#868993] flex items-center gap-1">
                                <ShieldCheck size={14} className="text-[#089981]"/> Toplam: ₺{formatCurrency(results[0].totalPayment)}
                            </div>
                        </div>
                        <button className="w-full md:w-auto bg-[#089981] hover:bg-[#067a67] text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2">
                            Hemen Başvur <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* DİĞER BANKALAR */}
            <h3 className="text-xl font-bold mb-4 text-white">Diğer Banka Teklifleri</h3>
            <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-[#1e222d] border-b border-[#2a2e39] text-[#868993] text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold">Banka Adı</th>
                            <th className="p-4 font-semibold text-center">Faiz Oranı</th>
                            <th className="p-4 font-semibold text-right">Net Getiri</th>
                            <th className="p-4 font-semibold text-right">Dönem Sonu Toplam</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2e39]">
                        {results.slice(1).map((item, idx) => (
                            <tr key={idx} className="hover:bg-[#1e222d] transition-colors group">
                                <td className="p-4 font-bold text-white flex items-center gap-3">
                                    <Building size={16} className="text-[#868993] group-hover:text-[#2962ff]" />
                                    {item.bankName}
                                </td>
                                <td className="p-4 text-center text-sm font-mono font-bold text-white">%{item.annualRate.toFixed(2)}</td>
                                <td className="p-4 text-right font-mono font-bold text-[#089981]">+₺{formatCurrency(item.netYield)}</td>
                                <td className="p-4 text-right font-mono font-medium text-[#c8cbd1]">₺{formatCurrency(item.totalPayment)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}