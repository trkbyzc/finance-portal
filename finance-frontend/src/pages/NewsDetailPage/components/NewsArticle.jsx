import React from 'react';
import { Clock, Globe, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../utils/formatters/dateFormatter';
import NewsAssetChip from '../../../components/news/NewsAssetChip';

export default function NewsArticle({ newsItem, content, loading, navigate }) {
    const { t } = useTranslation('news');
    return (
        <div className="flex-1">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-muted hover:text-text mb-6 transition-colors">
                <ArrowLeft size={20} /> {t('detail.back')}
            </button>

            <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className="text-primary text-xs font-bold uppercase px-3 py-1 bg-primary/10 rounded-full">{newsItem.category}</span>
                <span className="text-text-muted text-sm flex items-center gap-1">
                    <Clock size={14} /> {formatDateTime(newsItem.pubDate)}
                </span>
                <span className="text-text-muted text-sm flex items-center gap-1">
                    <Globe size={14} /> {newsItem.source}
                </span>
                <NewsAssetChip item={newsItem} />
            </div>

            <h1 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">{newsItem.title}</h1>

            {newsItem.imageUrl && (
                <img src={newsItem.imageUrl} alt={newsItem.title} className="w-full h-auto max-h-[500px] object-cover rounded-2xl mb-8 border border-border shadow-lg" />
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                    <Loader2 className="animate-spin text-primary mb-4" size={40} />
                    <p className="animate-pulse">{t('detail.loading')}</p>
                </div>
            ) : (
                <div className="text-text text-lg leading-relaxed whitespace-pre-line font-serif pb-10 border-b border-border">
                    {content}
                </div>
            )}

            <div className="pt-6 flex justify-end">
                <a href={newsItem.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:text-text transition-colors font-bold">
                    <ExternalLink size={18} /> {t('detail.readFullArticle')}
                </a>
            </div>
        </div>
    );
}
