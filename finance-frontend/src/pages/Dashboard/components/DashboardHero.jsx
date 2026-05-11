import React from 'react';
import { Activity, ArrowRight, UserPlus } from 'lucide-react';

export default function DashboardHero({ navigate }) {
    return (
        <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2962ff]/10 border border-[#2962ff]/20 text-[#2962ff] text-sm font-medium">
                <Activity size={16} /> Canlı Piyasa Terminali
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Tüm piyasalar <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2962ff] to-[#00c853]">tek ekranda.</span>
            </h1>
            <p className="text-lg text-[#787b86] max-w-lg">
                Borsa, döviz, emtia ve kripto dünyasını anlık verilerle takip et. Gerçek zamanlı verilerle finansal rotanı belirle.
            </p>
            <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate('/markets/live')} className="px-8 py-3.5 rounded-lg bg-[#2962ff] hover:bg-[#1e4eb8] transition-colors font-semibold flex items-center gap-2">
                    Piyasaları Keşfet <ArrowRight size={18} />
                </button>
                <button onClick={() => navigate('/register')} className="px-8 py-3.5 rounded-lg bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] transition-colors font-semibold flex items-center gap-2 text-white">
                    <UserPlus size={18} /> Ücretsiz Kayıt Ol
                </button>
            </div>
        </div>
    );
}