import React from 'react';
import { Zap, LineChart, Rocket } from 'lucide-react';

// 🚀 FAZA 2: FeatureCard Dashboard.jsx'den ayrıldı
const FEATURES = [
    {
        icon: <Zap className="text-[#fbbf24]" size={24}/>,
        title: 'Canlı Veri Akışı',
        desc: 'BIST, TCMB, Kripto ve Global piyasa verilerini saniyesinde, gecikmesiz olarak ekranınızda görün.'
    },
    {
        icon: <LineChart className="text-[#2962ff]" size={24}/>,
        title: 'Profesyonel Grafikler',
        desc: 'Gelişmiş indikatörler ve teknik analiz araçlarıyla piyasa trendlerini profesyonelce okuyun.'
    },
    {
        icon: <Rocket className="text-[#00c853]" size={24}/>,
        title: 'Halka Arz & Gündem',
        desc: 'Yaklaşan halka arzları kaçırmayın, piyasayı etkileyecek son dakika haberlerine tek tıkla ulaşın.'
    }
];

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="p-6 bg-[#131722] border border-[#2a2e39] rounded-2xl hover:border-[#2962ff]/40 hover:-translate-y-1 transition duration-300">
            <div className="mb-4 bg-[#1e222d] w-12 h-12 rounded-xl flex items-center justify-center border border-[#2a2e39]">
                {icon}
            </div>
            <h3 className="font-bold mb-2 text-lg text-white">{title}</h3>
            <p className="text-sm text-[#787b86] leading-relaxed">{desc}</p>
        </div>
    );
}

export default function DashboardFeatures() {
    return (
        <div className="bg-[#131722] border-y border-[#2a2e39] py-20 w-full">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
                {FEATURES.map((feature, idx) => (
                    <FeatureCard key={idx} {...feature} />
                ))}
            </div>
        </div>
    );
}
