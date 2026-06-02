import React from 'react';
import { useTranslation } from 'react-i18next';

function FeatureCard({ title }) {
    return (
        <div className="p-6 bg-surface border border-border rounded-2xl hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
            <h3 className="font-bold text-lg text-text flex items-center gap-3">
                <span className="w-2 h-8 bg-primary rounded-full shrink-0"></span>
                {title}
            </h3>
        </div>
    );
}

export default function DashboardFeatures() {
    const { t } = useTranslation('dashboard');

    const features = [
        { title: t('features.realtime.title') },
        { title: t('features.tools.title') },
        { title: t('features.portfolio.title') }
    ];

    return (
        <section className="bg-bg-elevated border-y border-border py-16 w-full">
            <div className="max-w-container mx-auto px-6">
                <div className="text-center mb-12 max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-text-muted text-[11px] font-bold uppercase tracking-wider mb-3">
                        {t('features.title')}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text">
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
