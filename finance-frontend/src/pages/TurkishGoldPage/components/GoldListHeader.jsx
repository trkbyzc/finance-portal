import React from 'react';

export default function GoldListHeader() {
    return (
        <div className="hidden md:flex items-center justify-between px-6 py-2 text-[#868993] text-xs font-bold uppercase tracking-wider border-b border-[#2a2e39]/50 mb-2">
            <div className="w-1/3">Emtia Adı</div>
            <div className="w-1/3 text-center">Alış / Satış Fiyatı</div>
            <div className="w-1/3 text-right">Günlük Değişim</div>
        </div>
    );
}