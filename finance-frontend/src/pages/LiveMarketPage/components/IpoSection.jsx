import React from 'react';
import { Rocket, CalendarCheck, Info } from 'lucide-react';

export default function IpoSection({ ipos }) {
    return (
        <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                Halka Arz Takvimi <Rocket className="text-[#868993]" size={24} />
            </h2>
            {ipos && ipos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ipos.map((ipo, idx) => (
                        <div key={idx} className="bg-[#131722] border border-[#2a2e39] rounded-2xl p-6 shadow-lg hover:border-[#2962ff] transition-colors group cursor-default">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-[#1e222d] border border-[#2a2e39] flex items-center justify-center text-[#2962ff] font-bold text-sm group-hover:scale-110 transition-transform">IPO</div>
                                    <div>
                                        <h3 className="font-bold text-[#d1d4dc] text-lg">{ipo.name}</h3>
                                        <span className="text-xs text-[#868993] flex items-center gap-1 mt-1"><CalendarCheck size={12} /> {ipo.date}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-[#2a2e39]/50">
                                <div>
                                    <div className="text-xs text-[#868993]">Talep Fiyatı</div>
                                    <div className="font-mono font-bold text-[#d1d4dc]">{ipo.price}</div>
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#ff9800]/10 text-[#ff9800] border border-[#ff9800]/20">{ipo.status}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-[#131722] border-2 border-[#2a2e39] border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-[#1e222d] rounded-full flex items-center justify-center mb-4"><Info className="text-[#868993]" size={32} /></div>
                    <h3 className="text-lg font-bold text-[#d1d4dc] mb-2">Yaklaşan Halka Arz Bulunmuyor</h3>
                    <p className="text-[#868993] text-sm max-w-md leading-relaxed">Şu an için onaylanmış yeni bir halka arz bulunmamaktadır.</p>
                </div>
            )}
        </div>
    );
}