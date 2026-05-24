import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Coins } from 'lucide-react';
import { getCryptoIconUrl } from '../../../../../utils/cryptoUtils';

export default function CryptoTable({ data, loading }) {
    const navigate = useNavigate();

    if (loading) return <div className="h-96 animate-pulse bg-[#131722] border border-[#2a2e39] rounded-2xl"></div>;

    return (
        <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#2a2e39] bg-[#1e222d]/50 flex items-center gap-3">
                <Coins className="text-[#8b5cf6]" size={20} />
                <h2 className="text-lg font-bold text-white tracking-tight">Kripto Varlıklar</h2>
            </div>
            <div className="overflow-x-auto max-h-[700px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1e222d] sticky top-0 z-10 shadow-md">
                    <tr>
                        <th className="p-5 text-xs font-bold text-[#868993] uppercase tracking-wider">Varlık</th>
                        <th className="p-5 text-xs font-bold text-[#868993] uppercase tracking-wider text-right">Fiyat</th>
                        <th className="p-5 text-xs font-bold text-[#868993] uppercase tracking-wider text-right">24s Değişim</th>
                        <th className="p-5"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2e39]">
                    {data && data.length > 0 ? (
                        data.map((coin, index) => {
                            const symbol = coin?.currencyCode || "";

                            // 🚀 TETHER DÜZELTMESİ: Eğer sembol direkt USDT/USD/TRY ise silme, olduğu gibi bırak.
                            const displaySymbol = (symbol === 'USDT' || symbol === 'USD' || symbol === 'TRY')
                                ? symbol
                                : symbol.replace(/USDT|TRY|USD/g, '');

                            const fullName = coin?.currencyName || "Kripto Para";
                            const displayName = fullName.replace('Kripto - ', '');
                            const price = coin?.forexBuying || 0;
                            const change = coin?.changePercent || 0;
                            const isPositive = change > 0;

                            return (
                                <tr
                                    // 🚀 KONSOL HATASI DÜZELTMESİ: Key değerini benzersiz yaptık.
                                    key={`${symbol}-${index}`}
                                    onClick={() => {
                                        if (!symbol) return;

                                        // Eğer sembol zaten -USD veya =X içermiyorsa ekle
                                        const chartSymbol = (symbol.includes('-USD') || symbol.includes('=X'))
                                            ? symbol
                                            : `${symbol}-USD`;

                                        navigate(`/chart/${encodeURIComponent(chartSymbol)}?cat=CRYPTO`, { state: { type: 'crypto' } });
                                    }}
                                    className="hover:bg-[#1e222d] transition cursor-pointer group"
                                >
                                    <td className="p-5 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#1a1e29] border border-[#2a2e39] flex items-center justify-center overflow-hidden shadow-lg group-hover:border-[#8b5cf6] transition-colors p-1">
                                            <img
                                                src={getCryptoIconUrl(symbol)}
                                                alt={displaySymbol}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.innerHTML = `<span class="text-[10px] font-black text-[#8b5cf6]">${displaySymbol.substring(0,3)}</span>`;
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <div className="font-bold text-[#d1d4dc] group-hover:text-white transition tracking-tight">
                                                {displaySymbol}
                                            </div>
                                            <div className="text-[10px] text-[#868993] uppercase truncate max-w-[150px]">
                                                {displayName}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-5 text-right font-mono font-bold text-white">
                                        ${Number(price) < 1
                                        ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
                                        : Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    }
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs ${isPositive ? 'bg-[#089981]/10 text-[#089981]' : 'bg-[#f23645]/10 text-[#f23645]'}`}>
                                            {isPositive ? '+' : ''}{Number(change).toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <ChevronRight size={18} className="text-[#868993] group-hover:text-[#8b5cf6] transition" />
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="4" className="p-10 text-center text-[#868993]">Kripto verisi bulunamadı.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}