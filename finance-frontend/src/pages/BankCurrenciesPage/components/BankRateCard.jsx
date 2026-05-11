import React from 'react';
import { ArrowRightLeft, Building2 } from 'lucide-react';

export default function BankRateCard({ rate }) {
    // 🚀 ARTIK SPLIT HACK'İNE GEREK YOK, DİREKT BANKA ADI GELİYOR!
    const bankNameOnly = rate.bankName || rate.currencyName || "Banka";

    const buy = rate.forexBuying || 0;
    const sell = rate.forexSelling || 0;
    const spread = (sell - buy).toFixed(4);

    return (
        <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl p-6 shadow-xl hover:border-[#2962ff] transition-all group hover:-translate-y-1">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#2a2e39]/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1e222d] flex items-center justify-center text-[#2962ff] border border-[#2a2e39] group-hover:border-[#2962ff]/50 transition-colors">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">{bankNameOnly}</h3>
                        <span className="text-xs text-[#868993]">{rate.currencyCode}</span>
                    </div>
                </div>
                <span className="bg-[#2962ff]/10 text-[#2962ff] text-[10px] font-bold px-3 py-1.5 rounded-full border border-[#2962ff]/20 flex items-center gap-1.5 tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2962ff] animate-pulse"></span>
                    Canlı
                </span>
            </div>

            <div className="flex justify-between items-center px-2">
                <div className="flex flex-col">
                    <span className="text-[#868993] text-[10px] font-bold uppercase tracking-widest mb-1">Banka Alış</span>
                    <span className="text-2xl font-mono font-bold text-[#f23645]">
                        ₺{buy.toFixed(4)}
                    </span>
                </div>

                <ArrowRightLeft className="text-[#2a2e39] group-hover:text-[#2962ff] transition-colors" size={20} />

                <div className="flex flex-col text-right">
                    <span className="text-[#868993] text-[10px] font-bold uppercase tracking-widest mb-1">Banka Satış</span>
                    <span className="text-2xl font-mono font-bold text-[#089981]">
                        ₺{sell.toFixed(4)}
                    </span>
                </div>
            </div>

            {/* Alt Bilgi - Makas Aralığı */}
            <div className="mt-6 pt-4 border-t border-[#2a2e39]/50 flex justify-between items-center bg-[#1e222d]/30 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
                <span className="text-[#868993] text-xs font-bold uppercase tracking-wider">Makas (Spread)</span>
                <span className="font-mono text-sm font-bold text-[#ff9800] bg-[#ff9800]/10 px-2 py-1 rounded border border-[#ff9800]/20">
                    {spread} ₺
                </span>
            </div>
        </div>
    );
}