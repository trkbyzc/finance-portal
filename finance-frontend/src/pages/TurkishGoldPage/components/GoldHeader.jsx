import React from 'react';
import { Coins } from 'lucide-react';

export default function GoldHeader() {
    return (
        <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-4 uppercase text-[#ffb74d]">
                <Coins className="text-[#ff9800]" size={36} />
                Türkiye Altın Piyasası
            </h1>
            <p className="text-[#868993] mt-2 ml-12">
                Kapalıçarşı güncel altın fiyatları, alış-satış makasları ve anlık değişim oranları.
            </p>
        </div>
    );
}