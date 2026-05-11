import React from 'react';
import { Calculator } from 'lucide-react';

export default function DashboardCalculator({ calcAmount, setCalcAmount, calcCurrency, setCalcCurrency, calculatedResult, usdRate }) {
    return (
        <div className="bg-[#1e222d] border border-[#2a2e39] rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
            {usdRate === 0 && (
                <div className="absolute inset-0 bg-[#131722]/80 backdrop-blur-sm z-10 flex items-center justify-center text-xs text-[#787b86] animate-pulse">
                    Canlı Kurlar Bağlanıyor...
                </div>
            )}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#2962ff]/10 rounded-lg">
                    <Calculator className="text-[#2962ff]" size={22}/>
                </div>
                <h3 className="text-lg font-bold">Hızlı Döviz Çevirici</h3>
            </div>
            <div className="space-y-4">
                <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    placeholder="Miktar girin"
                    className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg p-3 text-white outline-none focus:border-[#2962ff] transition-colors font-mono"
                />
                <div className="flex gap-2">
                    {['USD', 'EUR'].map(c => (
                        <button
                            key={c}
                            onClick={() => setCalcCurrency(c)}
                            className={`flex-1 py-2 rounded-lg border text-xs font-bold transition ${calcCurrency === c ? 'bg-[#2962ff]/20 border-[#2962ff] text-[#2962ff]' : 'bg-[#131722] border-[#2a2e39] text-[#787b86] hover:text-white hover:border-[#787b86]'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
                <div className="pt-6 border-t border-[#2a2e39] mt-2">
                    <div className="text-3xl font-black text-white font-mono tracking-tight">₺ {calculatedResult}</div>
                    <p className="text-[10px] text-[#787b86] mt-3">Bu araç arka planda TCMB canlı veri akışını kullanmaktadır.</p>
                </div>
            </div>
        </div>
    );
}