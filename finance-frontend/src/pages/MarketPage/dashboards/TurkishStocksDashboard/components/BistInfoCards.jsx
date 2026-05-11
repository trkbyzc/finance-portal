import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Layers, Activity } from 'lucide-react';
import { useMarketData } from '../../../../../hooks/useMarketData.js';

export default function BistInfoCards() {
    const { data: stocks, loading: isLoading } = useMarketData('tr-stocks');

    const stats = useMemo(() => {
        if (!stocks.length) return { gainers: 0, losers: 0, trend: 'NEUTRAL' };

        // 🚀 DÜZELTME: Hem changePercent hem regularMarketChangePercent aranıyor
        const gainers = stocks.filter(s => (s.changePercent || s.regularMarketChangePercent || 0) > 0).length;
        const losers = stocks.filter(s => (s.changePercent || s.regularMarketChangePercent || 0) < 0).length;

        return {
            gainers,
            losers,
            total: stocks.length,
            trend: gainers > losers ? 'BULL' : 'BEAR'
        };
    }, [stocks]);

    if (isLoading) return <div className="h-24 animate-pulse bg-[#131722] rounded-xl mb-8 border border-[#2a2e39]"></div>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#131722] border border-[#2a2e39] p-5 rounded-xl flex items-center justify-between shadow-lg">
                <div>
                    <p className="text-[#868993] text-xs font-bold uppercase tracking-wider mb-1">Listelenen Hisse</p>
                    <h3 className="text-2xl font-black text-white">{stats.total}</h3>
                </div>
                <div className="w-12 h-12 bg-[#2962ff]/10 rounded-full flex items-center justify-center text-[#2962ff]">
                    <Layers size={24} />
                </div>
            </div>

            <div className="bg-[#131722] border border-[#2a2e39] p-5 rounded-xl flex items-center justify-between shadow-lg">
                <div>
                    <p className="text-[#868993] text-xs font-bold uppercase tracking-wider mb-1">Piyasa Yönü</p>
                    <h3 className={`text-2xl font-black ${stats.trend === 'BULL' ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {stats.trend === 'BULL' ? 'Pozitif Ağırlıklı' : 'Negatif Ağırlıklı'}
                    </h3>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.trend === 'BULL' ? 'bg-[#089981]/10 text-[#089981]' : 'bg-[#f23645]/10 text-[#f23645]'}`}>
                    <Activity size={24} />
                </div>
            </div>

            <div className="bg-[#131722] border border-[#2a2e39] p-5 rounded-xl flex gap-4 shadow-lg">
                <div className="flex-1 flex flex-col items-center justify-center border-r border-[#2a2e39]">
                    <TrendingUp size={20} className="text-[#089981] mb-1" />
                    <span className="text-xl font-bold text-[#089981]">{stats.gainers}</span>
                    <span className="text-[10px] text-[#868993] uppercase">Yükselen</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <TrendingDown size={20} className="text-[#f23645] mb-1" />
                    <span className="text-xl font-bold text-[#f23645]">{stats.losers}</span>
                    <span className="text-[10px] text-[#868993] uppercase">Düşen</span>
                </div>
            </div>
        </div>
    );
}