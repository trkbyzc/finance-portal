import { Newspaper, Clock, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../utils/formatters/dateFormatter';

export default function NewsSidebar({ sidebarNews, navigate }) {
    const { t } = useTranslation('news');
    return (
        <div className="w-full lg:w-80 xl:w-96 shrink-0">
            <div className="sticky top-24">
                <h3 className="text-xl font-bold mb-6 border-b border-border pb-3 flex items-center gap-2">
                    <Newspaper className="text-primary" size={20} /> {t('detail.relatedNews')}
                </h3>
                <div className="flex flex-col gap-5">
                    {sidebarNews.map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate('/news/detail', { state: { newsItem: item } })}
                            className="cursor-pointer group flex items-start gap-4 p-3 rounded-xl hover:bg-surface border border-transparent hover:border-border transition-all"
                        >
                            {item.imageUrl ? (
                                <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden relative bg-surface-2">
                                    <div className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: `url('${item.imageUrl}')` }} />
                                </div>
                            ) : (
                                <div className="w-24 h-24 shrink-0 rounded-lg bg-surface-2 border border-border flex items-center justify-center">
                                    <Globe className="text-border" size={32} />
                                </div>
                            )}
                            <div className="flex-1">
                                <h4 className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-3 leading-snug mb-2">{item.title}</h4>
                                <span className="text-xs text-text-muted flex items-center gap-1">
                                    <Clock size={12} />{formatDateTime(item.pubDate)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
