import React from 'react';

export default function ViopHeader({ asset }) {
    const calculateRealFark = () => {
        if (!asset?.price || !asset?.changePercent) return "0.00";
        const prevClose = asset.price / (1 + (asset.changePercent / 100));
        const fark = asset.price - prevClose;
        return fark.toFixed(2);
    };

    const isPositive = asset?.changePercent >= 0;

    return (
        <div className="p-6 bg-[#131722] border-b border-[#2a2e39]">
            <h1 className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">
                {asset?.name || asset?.symbol}
            </h1>

            <div className="flex items-center gap-10">
                <div>
                    <div className={`text-4xl font-mono font-bold ${isPositive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {asset?.price?.toLocaleString('tr-TR', { minimumFractionDigits: 4 })}
                    </div>
                </div>

                <div className="text-left">
                    <div className="text-[#868993] text-[10px] uppercase font-bold mb-1">Fark</div>
                    <div className={`font-mono font-bold ${isPositive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {calculateRealFark()}
                    </div>
                </div>

                <div className="text-left">
                    <div className="text-[#868993] text-[10px] uppercase font-bold mb-1">Değişim</div>
                    <div className={`font-mono font-bold ${isPositive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {asset?.changePercent > 0 ? '+' : ''}{asset?.changePercent?.toFixed(2)}%
                    </div>
                </div>
            </div>
        </div>
    );
}