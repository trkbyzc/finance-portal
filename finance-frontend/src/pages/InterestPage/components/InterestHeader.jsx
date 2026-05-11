import React from 'react';
import { Calculator, TrendingUp } from 'lucide-react';

export default function InterestHeader() {
    return (
        <header className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#089981]/10 border border-[#089981]/20 text-[#089981] text-sm font-medium mb-4">
                <TrendingUp size={16} /> En Yüksek Oranlar
            </div>
            <h1 className="text-3xl md:text-5xl font-bold flex items-center justify-center md:justify-start gap-4 mb-4">
                <Calculator className="text-[#2962ff]" size={40} /> Mevduat Simülatörü
            </h1>
            <p className="text-[#868993] text-lg max-w-2xl">
                Paranıza en yüksek getiriyi sağlayan bankayı bulun. Güncel faiz oranları ve stopaj kesintileri hesaba katılarak net kazancınızı saniyeler içinde hesaplayın.
            </p>
        </header>
    );
}