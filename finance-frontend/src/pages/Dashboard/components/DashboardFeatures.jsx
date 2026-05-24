import React from 'react';
import { Zap, LineChart, Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ACCENT_CLASS = {
    primary: 'text-primary bg-primary/10 border-primary/30',
    buy: 'text-buy bg-buy/10 border-buy/30',
    warning: 'text-warning bg-warning/10 border-warning/30'
};

function FeatureCard({ icon: Icon, accent, title, desc }) {
    return (
        <div className="p-6 bg-surface border border-border rounded-2xl hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
            <div className={`mb-5 w-12 h-12 rounded-xl flex items-center justify-center border ${ACCENT_CLASS[accent]} group-hover:scale-110 transition-transform`}>
                <Icon size={22} />
            </div>
            <h3 className="font-bold mb-2 text-lg text-text">{title}</h3>
            <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
        </div>
    );
}

export default function DashboardFeatures() {
    const { t } = useTranslation('dashboard');

    const features = [
        { icon: Zap, accent: 'warning', title: t('features.realtime.title'), desc: t('features.realtime.desc') },
        { icon: LineChart, accent: 'primary', title: t('features.tools.title'), desc: t('features.tools.desc') },
        { icon: Rocket, accent: 'buy', title: t('features.portfolio.title'), desc: t('features.portfolio.desc') }
    ];

    return (
        <section className="bg-bg-elevated border-y border-border py-16 w-full">
            <div className="max-w-container mx-auto px-6">
                <div className="text-center mb-12 max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-text-muted text-[11px] font-bold uppercase tracking-wider mb-3">
                        {t('features.title')}
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-text">
                        {t('features.subtitle')}
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <FeatureCard key={idx} {...feature} />
                    ))}
                </div>
            </div>
        </section>
    );
}
