import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, Clock, ExternalLink, Box } from 'lucide-react';

export default function CommodityNewsSidebar({ news, loading }) {
    const navigate = useNavigate();

    return (
        <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl shadow-2xl p-5 sticky top-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2a2e39]">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Box className="text-[#fbbf24]" size={20} /> Piyasadan Haberler
                </h2>
                <button onClick={() => navigate('/news')} className="text-xs text-[#fbbf24] font-bold uppercase hover:text-white transition">Tümü</button>
            </div>

            {loading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse bg-[#1e222d] rounded-xl border border-[#2a2e39]"></div>)}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {news && news.length > 0 ? (
                        news.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => navigate('/news/detail', { state: { newsItem: item } })}
                                className="group cursor-pointer p-3 rounded-xl bg-[#1e222d] border border-[#2a2e39] hover:border-[#fbbf24] transition-all flex gap-3"
                            >
                                <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-[#2a2e39]">
                                    <img
                                        src={item.imageUrl}
                                        alt="news"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                                <div className="flex flex-col justify-between flex-1 min-w-0">
                                    <h3 className="text-[11px] font-bold text-[#d1d4dc] group-hover:text-white line-clamp-2 leading-tight">
                                        {item.title}
                                    </h3>
                                    <div className="flex items-center justify-between text-[9px] text-[#868993] font-black uppercase mt-1">
                                        <span className="text-[#fbbf24]">{item.source || "Haber Merkezi"}</span>
                                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(item.pubDate).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-[#868993] text-xs py-4">Güncel emtia haberi bulunamadı.</div>
                    )}
                </div>
            )}

            <button onClick={() => navigate('/news')} className="w-full mt-6 py-3 rounded-xl bg-[#1e222d] hover:bg-[#fbbf24] text-[#868993] hover:text-black border border-[#2a2e39] hover:border-[#fbbf24] transition-all text-[10px] font-black uppercase flex items-center justify-center gap-2 group">
                Tüm Analizler <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}