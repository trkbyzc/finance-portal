import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ExternalLink, Cpu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../../../utils/formatters/dateFormatter';

export default function CryptoNewsSidebar({ news, loading }) {
    const navigate = useNavigate();
    const { t } = useTranslation(['markets', 'common', 'news']);

    return (
        <div className="bg-surface border border-border rounded-2xl shadow-2xl p-5 sticky top-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                    <Cpu className="text-primary" size={20} /> {t('markets:crypto.newsTitle')}
                </h2>
                <button onClick={() => navigate('/news')} className="text-xs text-primary font-bold uppercase hover:text-text transition">{t('common:actions.viewAll')}</button>
            </div>

            {loading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse bg-surface-2 rounded-xl border border-border"></div>)}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {news.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => navigate('/news/detail', { state: { newsItem: item } })}
                            className="group cursor-pointer p-3 rounded-xl bg-surface-2 border border-border hover:border-primary transition-all flex gap-3"
                        >
                            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-border">
                                <img src={item.imageUrl} alt="news" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.style.display = 'none'; }} />
                            </div>
                            <div className="flex flex-col justify-between flex-1 min-w-0">
                                <h3 className="text-[11px] font-bold text-text group-hover:text-text line-clamp-2 leading-tight">
                                    {item.title}
                                </h3>
                                <div className="flex items-center justify-between text-[9px] text-text-muted font-black uppercase mt-1">
                                    <span className="text-primary">{item.source}</span>
                                    <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(item.pubDate)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button onClick={() => navigate('/news')} className="w-full mt-6 py-3 rounded-xl bg-surface-2 hover:bg-primary text-text-muted hover:text-text border border-border hover:border-primary transition-all text-[10px] font-black uppercase flex items-center justify-center gap-2 group">
                {t('news:pageTitle')} <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
