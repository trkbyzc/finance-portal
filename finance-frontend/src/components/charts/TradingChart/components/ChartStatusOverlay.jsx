import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ChartStatusOverlay({ isLoading, error }) {
    if (isLoading) {
        return (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#131722]/80 backdrop-blur-sm transition-opacity duration-300">
                <Loader2 size={32} className="text-[#2962ff] animate-spin mb-2" />
                <span className="text-[#787b86] text-sm font-bold tracking-wider">Veriler Getiriliyor...</span>
            </div>
        );
    }
    if (error) {
        // 🚀 BEYAZ EKRAN ÇÖZÜMÜ: Gelen error bir obje ise mesajını al, string ise direkt bas.
        const errorMessage = typeof error === 'string' ? error : error?.message || 'Veri çekilirken bir hata oluştu.';

        return (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#131722]/90 backdrop-blur-sm">
                <span className="text-red-400 text-sm font-bold bg-red-500/10 px-6 py-3 rounded-lg border border-red-500/20">
                    {errorMessage}
                </span>
            </div>
        );
    }
    return null;
}