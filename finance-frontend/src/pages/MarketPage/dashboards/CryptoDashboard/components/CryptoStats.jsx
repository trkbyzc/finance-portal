import { useMemo } from 'react';
import { Activity, Zap, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Büyük USD tutarını kısa formatla: 2.43T / 18.7B / 950M. */
const fmtUsdCompact = (n) => {
    if (!n || !Number.isFinite(n)) return '—';
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${Math.round(n).toLocaleString('en-US')}`;
};

export default function CryptoStats({ coins, loading }) {
    const { t } = useTranslation('markets');

    // Listedeki coin'lerden (CoinGecko market_cap / total_volume) gerçek istatistik hesapla.
    // Liste piyasa değerine göre ilk ~500 coin olduğundan global toplamların çok yakın bir tahminidir.
    const { totalVolume, btcDominance } = useMemo(() => {
        const list = coins || [];
        let vol = 0, totalCap = 0, btcCap = 0;
        for (const c of list) {
            vol += Number(c.volume24h) || 0;
            const cap = Number(c.marketCap) || 0;
            totalCap += cap;
            if (c.currencyCode === 'BTC') btcCap = cap;
        }
        return {
            totalVolume: vol,
            btcDominance: totalCap > 0 && btcCap > 0 ? (btcCap / totalCap) * 100 : null
        };
    }, [coins]);

    if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 h-24 animate-pulse bg-surface rounded-xl"></div>;

    const coinCount = (coins || []).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface border border-border p-5 rounded-2xl flex items-center justify-between shadow-lg group hover:border-primary transition-all">
                <div>
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{t('crypto.volume24h')}</p>
                    <h3 className="text-xl font-black text-text">{totalVolume > 0 ? fmtUsdCompact(totalVolume) : '—'}</h3>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Activity size={24} />
                </div>
            </div>

            <div className="bg-surface border border-border p-5 rounded-2xl flex items-center justify-between shadow-lg group hover:border-warning transition-all">
                <div>
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{t('crypto.btcDominance')}</p>
                    <h3 className="text-xl font-black text-warning">{btcDominance == null ? '—' : `${btcDominance.toFixed(1)}%`}</h3>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center text-warning">
                    <Zap size={24} />
                </div>
            </div>

            <div className="bg-surface border border-border p-5 rounded-2xl flex items-center justify-between shadow-lg group hover:border-buy transition-all">
                <div>
                    <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{t('crypto.activeCoins')}</p>
                    <h3 className="text-xl font-black text-text">{coinCount}</h3>
                </div>
                <div className="w-12 h-12 bg-buy/10 rounded-xl flex items-center justify-center text-buy">
                    <BarChart3 size={24} />
                </div>
            </div>
        </div>
    );
}
