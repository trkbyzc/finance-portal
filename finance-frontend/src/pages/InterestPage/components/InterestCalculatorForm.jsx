import React from 'react';
import { DollarSign, Calendar, Info } from 'lucide-react';

export default function InterestCalculatorForm({
                                                   amount, setAmount, days, setDays, loading, presetDays
                                               }) {
    return (
        <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl p-6 shadow-2xl sticky top-24 relative overflow-hidden">
            {/* Eğer yükleme devam ediyorsa hafif bir blur veya bar verilebilir */}
            {loading && (
                <div className="absolute top-0 left-0 w-full h-1 bg-[#2962ff] animate-pulse"></div>
            )}

            <h3 className="text-xl font-bold mb-6 border-b border-[#2a2e39] pb-4 flex items-center gap-2">
                Hesaplama Detayları
            </h3>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-[#868993] mb-2 flex items-center gap-2">
                        <DollarSign size={16}/> Yatırım Tutarı (TL)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 pl-12 text-xl font-bold text-white outline-none focus:border-[#2962ff] transition-all"
                            min="1000"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868993] font-bold">₺</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#868993] mb-2 flex items-center gap-2">
                        <Calendar size={16}/> Vade Süresi (Gün)
                    </label>
                    <input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="w-full bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 text-xl font-bold text-white outline-none focus:border-[#2962ff] transition-all mb-3"
                        min="1"
                    />
                    <div className="flex flex-wrap gap-2">
                        {presetDays.map(d => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => setDays(d)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${days === d ? 'bg-[#2962ff]/20 border-[#2962ff] text-[#2962ff]' : 'bg-[#1e222d] border-[#2a2e39] text-[#868993] hover:text-white hover:border-[#868993]'}`}
                            >
                                {d} Gün
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-[#1e222d] border border-[#2a2e39] p-4 rounded-xl flex items-start gap-3 text-[#868993] text-sm">
                    <Info className="shrink-0 text-[#2962ff] mt-0.5" size={18} />
                    <p className="leading-relaxed">
                        6 aya kadar olan vadeler için <strong className="text-white">%7.5 Stopaj</strong> kesintisi dahildir. Tutarları veya günü değiştirdiğinizde tabloda sonuçlar otomatik güncellenir.
                    </p>
                </div>
            </div>
        </div>
    );
}