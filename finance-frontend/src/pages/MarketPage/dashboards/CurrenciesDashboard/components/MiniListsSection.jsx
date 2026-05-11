import React from 'react';
import { PieChart, Info } from 'lucide-react';

export default function MiniListsSection({ data, category, navigate }) {
    if (category === 'tr-funds') {
        return (
            <div className="p-8 grid md:grid-cols-3 gap-8">
                <MiniList title="🚀 Aylık Liderler" data={[...data].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 5)} navigate={navigate} />
                <MiniList title="🔻 Düzeltme Yapanlar" data={[...data].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 5)} navigate={navigate} />

                <div className="bg-[#131722] p-6 rounded-2xl border border-[#2a2e39] shadow-lg flex flex-col justify-center">
                    <h3 className="font-bold text-lg text-[#d1d4dc] mb-4 flex items-center gap-2">
                        <PieChart className="text-[#2962ff]" size={24} /> Fon Piyasası Rehberi
                    </h3>
                    <p className="text-sm text-[#868993] leading-relaxed mb-6">
                        Yatırım fonları, profesyonel portföy yöneticileri tarafından yönetilen ve riskin dağıtıldığı sepetlerdir. TEFAS platformu üzerinden dilediğiniz bankadan işlem yapabilirsiniz.
                    </p>
                    <div className="bg-[#1e222d] p-3 rounded-xl border border-[#2a2e39] flex gap-3 items-start">
                        <Info className="text-[#ff9800] shrink-0" size={18} />
                        <div className="flex flex-col">
                            <span className="text-xs text-[#d1d4dc] font-bold">Önemli Hatırlatma</span>
                            <span className="text-[11px] text-[#868993]">Fon getirileri geçmiş performansı yansıtır, gelecek için kesin bir garanti oluşturmaz.</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 grid md:grid-cols-3 gap-8">
            <MiniList title="En Yüksek Değerliler" data={data.slice(0, 5)} navigate={navigate} />
            <MiniList title="En Çok Artanlar" data={[...data].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 5)} navigate={navigate} />
            <MiniList title="En Çok Azalanlar" data={[...data].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 5)} navigate={navigate} />
        </div>
    );
}

// Alt liste bileşeni (Sadece bu dosya içinde kullanılır)
function MiniList({ title, data, navigate }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="space-y-4 bg-[#131722] p-5 rounded-2xl border border-[#2a2e39] shadow-lg">
            <h3 className="font-bold text-base flex justify-between items-center group text-[#d1d4dc] pb-2 border-b border-[#2a2e39]/50">
                {title}
            </h3>
            <div className="space-y-1">
                {data.map((item, i) => {
                    const symbol = item.symbol || item.currencyCode || item.yahooSymbol;
                    const isFund = item.assetCategory === 'FUND';

                    return (
                        <div key={i} onClick={() => navigate(`/chart/${encodeURIComponent(symbol)}`)} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#1e222d] transition-colors cursor-pointer group">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase text-[#d1d4dc] group-hover:text-white">
                                    {symbol.replace('-USD', '').replace('.IS', '')}
                                </span>
                                <span className="text-[10px] text-[#868993] truncate w-32">{item.name || item.currencyName}</span>
                            </div>
                            <div className="text-right">
                                {!isFund && (
                                    <div className="text-xs font-mono font-bold text-[#d1d4dc]">{(item.price || item.forexSelling)?.toLocaleString('tr-TR')}</div>
                                )}
                                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block ${!isFund ? 'mt-1' : ''} ${item.changePercent >= 0 ? 'text-[#089981] bg-[#089981]/10' : 'text-[#f23645] bg-[#f23645]/10'}`}>
                                    {item.changePercent > 0 ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}