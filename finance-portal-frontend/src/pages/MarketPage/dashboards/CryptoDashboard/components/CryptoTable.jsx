import { useNavigate } from 'react-router-dom';
import { ChevronRight, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Coin fiyatını biçimlendirir. 1$ altındaki çok küçük coinlerde (SHIB/PEPE)
 * 0'dan sonra 15 basamağa kadar gösterir; trailing sıfırlar otomatik kırpılır.
 */
const formatCryptoPrice = (price) => {
    const n = Number(price) || 0;
    const maxFractionDigits = n !== 0 && Math.abs(n) < 1 ? 15 : 2;
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: maxFractionDigits });
};

/** 24s hacmi kısa USD formatla: $2.43T / $18.7B / $950M. Veri yoksa em-dash. */
const formatVolume = (volume) => {
    const n = Number(volume) || 0;
    if (n <= 0) return '—';
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${Math.round(n).toLocaleString('en-US')}`;
};

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
                        <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('crypto.change24h')}</th>
                        <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('crypto.volume24h')}</th>
                        <th className="p-5"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2e39]">
                    {data && data.length > 0 ? (
                        data.map((coin, index) => {
                            const symbol = coin?.currencyCode || "";

                            // USDT/USD/TRY sembolü kendisi bir para birimi; suffix temizleme uygulanmaz.
                            const displaySymbol = (symbol === 'USDT' || symbol === 'USD' || symbol === 'TRY')
                                ? symbol
                                : symbol.replaceAll(/USDT|TRY|USD/g, '');

                            const fullName = coin?.currencyName || t('categories.crypto');
                            const displayName = fullName.replace('Kripto - ', '');
                            const price = coin?.forexBuying || 0;
                            const change = coin?.changePercent || 0;
                            const volume = coin?.volume24h || 0;
                            const isPositive = change > 0;

                            return (
                                <tr
                                    key={`${symbol}-${index}`}
                                    onClick={() => {
                                        if (!symbol) return;

                                        // Yahoo Finance chart URL'i için sembol her zaman -USD suffix'i gerektirir.
                                        const chartSymbol = (symbol.includes('-USD') || symbol.includes('=X'))
                                            ? symbol
                                            : `${symbol}-USD`;

                                        navigate(`/chart/${encodeURIComponent(chartSymbol)}?cat=CRYPTO`, { state: { type: 'crypto' } });
                                    }}
                                    className="hover:bg-surface-2 transition cursor-pointer group"
                                >
                                    <td className="p-5 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center overflow-hidden shadow-lg group-hover:border-primary transition-colors p-1">
                                            {coin?.image ? (
                                                <img
                                                    src={coin.image}
                                                    alt={displaySymbol}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        // CoinGecko ikonu yüklenmezse sembol metnine düş.
                                                        e.target.onerror = null;
                                                        e.target.style.display = 'none';
                                                        e.target.parentNode.innerHTML = `<span class="text-[10px] font-black text-primary">${displaySymbol.substring(0, 3)}</span>`;
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-[10px] font-black text-primary">{displaySymbol.substring(0, 3)}</span>
                                            )}
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
                                        ${formatCryptoPrice(price)}
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs ${isPositive ? 'bg-buy/10 text-buy' : 'bg-sell/10 text-sell'}`}>
                                            {isPositive ? '+' : ''}{Number(change).toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="p-5 text-right font-mono font-semibold text-text-muted">
                                        {formatVolume(volume)}
                                    </td>
                                    <td className="p-5 text-right">
                                        <ChevronRight size={18} className="text-text-muted group-hover:text-primary transition" />
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="5" className="p-10 text-center text-text-muted">{t('common.noResults')}</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}