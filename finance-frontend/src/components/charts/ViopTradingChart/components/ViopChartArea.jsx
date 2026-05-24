import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ViopChartArea({ chartContainerRef, loading }) {
    return (
        <div className="flex-1 relative bg-surface p-4 min-h-100">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg/60 backdrop-blur-sm">
                    <Loader2 className="animate-spin text-primary" size={40} />
                </div>
            )}
            <div ref={chartContainerRef} className="w-full h-full min-h-87" />

            <div className="mt-4 flex justify-between text-[10px] text-text-muted font-medium border-t border-border pt-4">
                <div>GRAFİK TL BAZINDA GÖSTERİLMEKTEDİR</div>
                <div className="flex gap-4">
                    <span>GECİKMELİ VERİ: 15 DK</span>
                    <span>{new Date().toLocaleTimeString('tr-TR')}</span>
                </div>
            </div>
        </div>
    );
}
