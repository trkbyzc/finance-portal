import React from 'react';
import { ChevronRight, CalendarCheck, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function IpoSection({ ipos }) {
    const { t } = useTranslation('markets');
    return (
        <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-text flex items-center gap-2">
                {t('live.ipoCalendar')} <ChevronRight className="text-text-muted" size={24} />
            </h2>
            {ipos && ipos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ipos.map((ipo, idx) => (
                        <div key={idx} className="bg-surface border border-border rounded-2xl p-6 shadow-lg hover:border-primary transition-colors group cursor-default">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-primary font-bold text-sm group-hover:scale-110 transition-transform">IPO</div>
                                    <div>
                                        <h3 className="font-bold text-text text-lg">{ipo.name}</h3>
                                        <span className="text-xs text-text-muted flex items-center gap-1 mt-1"><CalendarCheck size={12} /> {ipo.date}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-border/50">
                                <div>
                                    <div className="text-xs text-text-muted">{t('live.demandPrice')}</div>
                                    <div className="font-mono font-bold text-text">{ipo.price}</div>
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-warning/10 text-warning border border-warning/20">{ipo.status}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-surface border-2 border-border border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mb-4"><Info className="text-text-muted" size={32} /></div>
                    <h3 className="text-lg font-bold text-text mb-2">{t('live.noIpos')}</h3>
                    <p className="text-text-muted text-sm max-w-md leading-relaxed">{t('live.noIposDetail')}</p>
                </div>
            )}
        </div>
    );
}
