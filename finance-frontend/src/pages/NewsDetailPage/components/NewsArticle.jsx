import React from 'react';
import { Clock, Globe, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';

export default function NewsArticle({ newsItem, content, loading, navigate }) {
    return (
        <div className="flex-1">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#868993] hover:text-white mb-6 transition-colors">
                <ArrowLeft size={20} /> Geri Dön
            </button>

            <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className="text-[#2962ff] text-xs font-bold uppercase px-3 py-1 bg-[#2962ff]/10 rounded-full">{newsItem.category}</span>
                <span className="text-[#868993] text-sm flex items-center gap-1">
                    <Clock size={14} /> {new Date(newsItem.pubDate).toLocaleString('tr-TR')}
                </span>
                <span className="text-[#868993] text-sm flex items-center gap-1">
                    <Globe size={14} /> {newsItem.source}
                </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">{newsItem.title}</h1>

            {newsItem.imageUrl && (
                <img src={newsItem.imageUrl} alt={newsItem.title} className="w-full h-auto max-h-[500px] object-cover rounded-2xl mb-8 border border-[#2a2e39] shadow-lg" />
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#868993]">
                    <Loader2 className="animate-spin text-[#2962ff] mb-4" size={40} />
                    <p className="animate-pulse">Haber metni canlı olarak kazınıyor...</p>
                </div>
            ) : (
                <div className="text-[#d1d4dc] text-lg leading-relaxed whitespace-pre-line font-serif pb-10 border-b border-[#2a2e39]">
                    {content}
                </div>
            )}

            <div className="pt-6 flex justify-end">
                <a href={newsItem.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#2962ff] hover:text-white transition-colors font-bold">
                    <ExternalLink size={18} /> Orijinal Kaynağa Git
                </a>
            </div>
        </div>
    );
}