import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, Clock, ExternalLink, Image as ImageIcon } from 'lucide-react';

export default function CurrencyNewsSidebar({ news, loading }) {
    const navigate = useNavigate();

    return (
        <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl shadow-2xl p-5 sticky top-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2a2e39]">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Newspaper className="text-[#10b981]" size={20} /> Haber Akışı
                </h2>
                <button onClick={() => navigate('/news')} className="text-xs text-[#10b981] font-bold uppercase hover:text-white transition">Tümü</button>
            </div>

            {loading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse bg-[#1e222d] rounded-xl border border-[#2a2e39]"></div>)}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {news.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => navigate('/news/detail', { state: { newsItem: item } })}
                            className="group cursor-pointer p-2.5 rounded-xl bg-[#1e222d] border border-[#2a2e39] hover:border-[#10b981] transition-all flex gap-3 min-h-[90px]"
                        >
                            <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-[#1a1e29] border border-[#2a2e39]">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt="news"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#2a2e39]">
                                        <ImageIcon size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col justify-between flex-1 py-0.5">
                                <h3 className="text-xs font-bold text-[#d1d4dc] group-hover:text-white line-clamp-2 leading-relaxed">
                                    {item.title}
                                </h3>
                                <div className="flex items-center justify-between text-[9px] text-[#868993] font-black uppercase tracking-tighter mt-1">
                                    <span className="text-[#10b981] truncate max-w-[70px]">{item.source}</span>
                                    <span className="flex items-center gap-1 shrink-0">
                                        <Clock size={10} />
                                        {new Date(item.pubDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button onClick={() => navigate('/news')} className="w-full mt-6 py-3 rounded-xl bg-[#1e222d] hover:bg-[#10b981] text-[#868993] hover:text-white border border-[#2a2e39] hover:border-[#10b981] transition-all text-[10px] font-black uppercase flex items-center justify-center gap-2 group">
                Tüm Haberler <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}