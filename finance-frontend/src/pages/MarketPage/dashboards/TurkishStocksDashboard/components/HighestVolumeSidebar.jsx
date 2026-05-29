import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../../../../../hooks/useMarketData.js';
import { useNavigate } from 'react-router-dom';
import { formatCompactVolume } from './volumeFormat';

/**
 * Hacim sidebar'ı — top 5 BIST hissesi (volume × price = işlem hacmi TL).
 *
 * Yatırımcı sinyali: hacimli alım pozitif teyit, hacimsiz fiyat artışı şüpheli.
 * Progress bar genişliği max volume'a göre normalize edilir.
 */
export default function HighestVolumeSidebar() {
    const { data: stocks, loading: isLoading } = useMarketData('tr-stocks');
    const navigate = useNavigate();
    const { t } = useTranslation('markets');

    const topVolume = useMemo(() => {
        if (!stocks.length) return [];
        // Volume × price = TL cinsinden işlem hacmi (lot sayısı değil parasal değer)
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

            <div className="flex flex-col gap-2.5">
                {topVolume.map((stock) => {
                    const price = stock.price ?? stock.regularMarketPrice ?? 0;
                    const widthPct = Math.max(8, (stock._tlVolume / maxVol) * 100);
                    return (
                        <div
                            key={stock.symbol}
                            onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}?cat=STOCK`)}
                            className="cursor-pointer group"
                        >
                            <div className="flex items-baseline justify-between mb-1 text-xs">
                                <div className="flex items-baseline gap-2 min-w-0">
                                    <span className="font-bold text-text group-hover:text-primary transition">
                                        {stock.symbol.replace('.IS', '')}
                                    </span>
                                    <span className="text-text-muted truncate max-w-[80px]">
                                        ₺{price.toFixed(2)}
                                    </span>
                                </div>
                                <span className="font-mono font-bold text-primary shrink-0">
                                    {formatCompactVolume(stock._tlVolume)} ₺
                                </span>
                            </div>
                            <div className="h-1.5 bg-bg rounded-full overflow-hidden">
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
