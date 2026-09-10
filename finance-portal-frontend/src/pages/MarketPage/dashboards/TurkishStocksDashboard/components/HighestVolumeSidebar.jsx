import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../../../../../hooks/useMarketData.js';
import { useNavigate } from 'react-router-dom';
import MiniSparkline from './MiniSparkline';
import { formatCompactVolume } from './volumeFormat';

const SPARK_BLUE = '#3b82f6';

/* Metrik: volume × price = TL cinsinden işlem hacmi; hacimli alım sahte fiyat hareketlerinden ayrışır. */
export default function HighestVolumeSidebar() {
    const { data: stocks, loading: isLoading } = useMarketData('tr-stocks');
    const navigate = useNavigate();
    const { t } = useTranslation('markets');

    // Her render'da tüm stocks dizisini yeniden sıralamaktan kaçınır; top-5 TL hacim listesi.
    const topVolume = useMemo(() => {
        if (!stocks.length) return [];
        const enriched = stocks.map(s => {
            const price = s.price ?? s.regularMarketPrice ?? 0;
            const vol = Number(s.volume ?? 0);
            return { ...s, _tlVolume: price * vol };
        });
        return [...enriched]
            .sort((a, b) => b._tlVolume - a._tlVolume)
            .slice(0, 5);
    }, [stocks]);

    const maxVol = topVolume[0]?._tlVolume || 1;

    if (isLoading) return <div className="h-64 animate-pulse bg-surface rounded-xl border border-border" />;

    return (
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" />
                {t('stocks.highestVolume', 'En Yüksek Hacim')}
            </h3>

            <div className="flex flex-col gap-3">
                {topVolume.map((stock) => {
                    const price = stock.price ?? stock.regularMarketPrice ?? 0;
                    const widthPct = Math.max(8, (stock._tlVolume / maxVol) * 100);
                    const sym = stock.symbol.replace('.IS', '');
                    return (
                        <div
                            key={stock.symbol}
                            onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}?cat=STOCK`)}
                            className="cursor-pointer group"
                        >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-baseline gap-1 min-w-0">
                                    <span className="font-bold text-text text-sm group-hover:text-primary transition shrink-0">
                                        {sym}
                                    </span>
                                    {stock.name && (
                                        <span className="text-[10px] text-text-muted truncate">
                                            ({stock.name})
                                        </span>
                                    )}
                                </div>

                                <div className="shrink-0">
                                    <MiniSparkline symbol={stock.symbol} color={SPARK_BLUE} width={60} height={22} />
                                </div>

                                <div className="text-xs font-mono whitespace-nowrap shrink-0">
                                    <span className="font-bold text-text">₺{price.toFixed(2)}</span>
                                    <span className="text-primary ml-1">({formatCompactVolume(stock._tlVolume)} ₺)</span>
                                </div>
                            </div>
                            <div className="h-1 bg-bg rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all"
                                    style={{ width: `${widthPct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
