import React from 'react';
import { Newspaper, Clock, Globe } from 'lucide-react';

export default function NewsSidebar({ sidebarNews, navigate }) {
    return (
        <div className="w-full lg:w-[350px] shrink-0">
            <div className="sticky top-24">
                <h3 className="text-xl font-bold mb-6 border-b border-[#2a2e39] pb-3 flex items-center gap-2">
                    <Newspaper className="text-[#2962ff]" size={20} /> Son Dakika
                </h3>
                <div className="flex flex-col gap-5">
                    {sidebarNews.map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate('/news/detail', { state: { newsItem: item } })}
                            className="cursor-pointer group flex items-start gap-4 p-3 rounded-xl hover:bg-[#131722] border border-transparent hover:border-[#2a2e39] transition-all"
                        >
                            {item.imageUrl ? (
                                <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden relative bg-[#1a1e29]">
                                    <div className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: `url('${item.imageUrl}')` }} />
                                </div>
                            ) : (
                                <div className="w-24 h-24 shrink-0 rounded-lg bg-[#1a1e29] border border-[#2a2e39] flex items-center justify-center">
                                    <Globe className="text-[#2a2e39]" size={32} />
                                </div>
                            )}
                            <div className="flex-1">
                                <h4 className="text-sm font-bold group-hover:text-[#2962ff] transition-colors line-clamp-3 leading-snug mb-2">{item.title}</h4>
                                <span className="text-xs text-[#868993] flex items-center gap-1">
                                    <Clock size={12} />{new Date(item.pubDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}