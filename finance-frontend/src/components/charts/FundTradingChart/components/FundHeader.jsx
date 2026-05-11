
import React from 'react';

export default function FundHeader({ symbol, isTefas, asset, chartData }) {
    // 🚀 Fallback olarak price, lastPrice veya forexBuying kontrolü eklendi
    const fallbackPrice = asset?.price || asset?.lastPrice || asset?.forexBuying || 0;
    const lastPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : fallbackPrice;
    const isPositive = asset?.changePercent >= 0;

    return (
        <div className="p-6 bg-[#131722] border-b border-[#2a2e39] flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
                    {symbol?.replace('.IS', '')}
                    {isTefas ? (
                        <span className="text-[10px] bg-[#2962ff]/20 text-[#2962ff] px-2 py-1 rounded border border-[#2962ff]/30">TEFAS</span>
                    ) : (
                        <span className="text-[10px] bg-[#8b5cf6]/20 text-[#8b5cf6] px-2 py-1 rounded border border-[#8b5cf6]/30">ETF</span>
                    )}
                </h1>
                <div className="text-sm text-[#868993] mt-1">{asset?.name || asset?.currencyName}</div>
            </div>

            <div className="text-right">
                <div className="text-3xl font-mono font-bold text-white">
                    {/* 🚀 FİYAT CİNSİ BURADA (TEFAS ise ₺, değilse $) */}
                    {isTefas ? '₺' : '$'}
                    {Number(lastPrice).toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                </div>
                <div className={`font-mono font-bold text-sm ${isPositive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                    {isPositive ? '+' : ''}{Number(asset?.changePercent || 0).toFixed(2)}%
                    <span className="text-[#868993] text-[10px] ml-1">(Değişim)</span>
                </div>
            </div>
        </div>
    );
}