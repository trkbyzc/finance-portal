import React from 'react';
import { Clock, Globe } from 'lucide-react';

export default function NewsCard({ item, isVerified, onClick }) {
    return (
        <div
            onClick={onClick}
            className="cursor-pointer group flex flex-col md:flex-row bg-[#131722] border border-[#2a2e39] rounded-2xl overflow-hidden hover:border-[#2962ff] transition-all shadow-lg min-h-[160px]"
        >
            {isVerified && (
                <div className="w-full md:w-72 h-48 md:h-auto shrink-0 relative bg-[#1a1e29]">
                    <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url('${item.imageUrl}')` }}
                    />
                </div>
            )}

            <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[#2962ff] text-[10px] font-bold uppercase">{item.category}</span>
                        <span className="text-[#868993] text-[10px] flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(item.pubDate).toLocaleString('tr-TR', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>
                    <h3 className={`font-bold mb-3 group-hover:text-[#2962ff] transition-colors leading-tight line-clamp-2 ${isVerified ? 'text-lg' : 'text-xl'}`}>
                        {item.title}
                    </h3>
                    <p className="text-[#868993] text-sm line-clamp-2 leading-relaxed">
                        {item.description}
                    </p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[#868993] text-xs font-semibold">
                    <Globe size={14} className="text-[#2962ff]" />
                    <span>{item.source}</span>
                </div>
            </div>
        </div>
    );
}