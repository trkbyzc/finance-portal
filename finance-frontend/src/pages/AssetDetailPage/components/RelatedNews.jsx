import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Newspaper, Clock, ChevronRight, ImageOff } from 'lucide-react';
import { newsApi } from '../../../services/api/newsApi';
import { formatDateTime } from '../../../utils/formatters/dateFormatter';

/**
 * Varlık detay sayfasında "İlgili Haberler" — bu varlığı (sembolü) etkileyen haberler.
 * Veri: GET /news/by-symbol?symbol=... (backend NewsEntityTagger relatedSymbol eşleşmesi).
 * Eşleşen haber yoksa hiçbir şey render edilmez (additive, mevcut sayfayı bozmaz).
 */
export default function RelatedNews({ symbol }) {
    const { t, i18n } = useTranslation(['asset', 'common']);
    const navigate = useNavigate();
    const lang = i18n.language?.startsWith('en') ? 'en' : 'tr';

    const { data = [] } = useQuery({
        queryKey: ['relatedNews', symbol, lang],
        queryFn: async () => {
            const res = await newsApi.getNewsBySymbol(symbol, 6, lang);
            return Array.isArray(res) ? res : (res?.content || []);
        },
        enabled: !!symbol,
        staleTime: 5 * 60 * 1000
    });

    if (!data || data.length === 0) return null;

    return (
        <div className="bg-surface border border-border rounded-3xl p-5 md:p-6 mb-8 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
                <Newspaper size={18} className="text-primary" />
                <h2 className="text-lg font-bold text-text">{t('asset:relatedNews.title', 'İlgili Haberler')}</h2>
                <span className="text-text-muted text-xs">({data.length})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.map((item, i) => (
                    <button
                        type="button"
                        key={`${item.link || i}-${i}`}
                        onClick={() => navigate('/news/detail', { state: { newsItem: item } })}
                        className="group flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border hover:border-primary/40 hover:bg-surface-hover cursor-pointer transition-all text-left w-full"
                    >
                        <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-border bg-bg flex items-center justify-center">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            ) : (
                                <ImageOff size={18} className="text-border" />
                            )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-text line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                {item.title}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-text-muted font-bold uppercase tracking-tight mt-1">
                                <span className="text-primary truncate max-w-[120px]">{item.source}</span>
                                <span className="flex items-center gap-1 shrink-0">
                                    <Clock size={10} /> {formatDateTime(item.pubDate)}
                                </span>
                            </div>
                        </div>
                        <ChevronRight size={16} className="shrink-0 text-border group-hover:text-primary transition-colors" />
                    </button>
                ))}
            </div>
        </div>
    );
}
