import React from 'react';
import { Clock, Globe } from 'lucide-react';
import { formatDateTime } from '../../../utils/formatters/dateFormatter';

export default function NewsCard({ item, isVerified, onClick }) {
    return (
        <div
            onClick={onClick}
            className="cursor-pointer group flex flex-col md:flex-row bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary transition-all shadow-lg min-h-[160px]"
        >
            {isVerified && (
                <div className="w-full md:w-72 h-48 md:h-auto shrink-0 relative bg-surface-2">
                    <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url('${item.imageUrl}')` }}
                    />
                </div>
            )}

            <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-primary text-[10px] font-bold uppercase">{item.category}</span>
                        <span className="text-text-muted text-[10px] flex items-center gap-1">
                            <Clock size={12} />
                            {formatDateTime(item.pubDate)}
                        </span>
                    </div>
                    <h3 className={`font-bold mb-3 group-hover:text-primary transition-colors leading-tight line-clamp-2 ${isVerified ? 'text-lg' : 'text-xl'}`}>
                        {item.title}
                    </h3>
                    <p className="text-text-muted text-sm line-clamp-2 leading-relaxed">
                        {item.description}
                    </p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-text-muted text-xs font-semibold">
                    <Globe size={14} className="text-primary" />
                    <span>{item.source}</span>
                </div>
            </div>
        </div>
    );
}
