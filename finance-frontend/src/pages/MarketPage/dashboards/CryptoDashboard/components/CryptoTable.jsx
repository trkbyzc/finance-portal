import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCryptoIconUrl } from '../../../../../utils/cryptoUtils';

export default function CryptoTable({ data, loading }) {
    const navigate = useNavigate();
    const { t } = useTranslation('markets');

    if (loading) return <div className="h-96 animate-pulse bg-surface border border-border rounded-2xl"></div>;

    return (
        <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border bg-surface-2/50 flex items-center gap-3">
                <Coins className="text-primary" size={20} />
                <h2 className="text-lg font-bold text-text tracking-tight">{t('categories.crypto')}</h2>
            </div>
            <div className="overflow-x-auto max-h-[700px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-2 sticky top-0 z-10 shadow-md">
                    <tr>
                        <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider">{t('stocks.tableCols.symbol')}</th>
                        <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('stocks.tableCols.price')}</th>
                        <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('crypto.volume24h')}</th>
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

                            const fullName = coin?.currencyName || t('categories.crypto');
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
                                    className="hover:bg-surface-2 transition cursor-pointer group"
                                >
                                    <td className="p-5 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center overflow-hidden shadow-lg group-hover:border-primary transition-colors p-1">
                                            <img
                                                src={getCryptoIconUrl(symbol)}
                                                alt={displaySymbol}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.innerHTML = `<span class="text-[10px] font-black text-primary">${displaySymbol.substring(0,3)}</span>`;
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <div className="font-bold text-text group-hover:text-text transition tracking-tight">
                                                {displaySymbol}
                                            </div>
                                            <div className="text-[10px] text-text-muted uppercase truncate max-w-[150px]">
                                                {displayName}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-5 text-right font-mono font-bold text-text">
                                        ${Number(price) < 1
                                        ? Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
                                        : Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    }
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs ${isPositive ? 'bg-buy/10 text-buy' : 'bg-sell/10 text-sell'}`}>
                                            {isPositive ? '+' : ''}{Number(change).toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <ChevronRight size={18} className="text-text-muted group-hover:text-primary transition" />
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="4" className="p-10 text-center text-text-muted">{t('common.noResults')}</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}