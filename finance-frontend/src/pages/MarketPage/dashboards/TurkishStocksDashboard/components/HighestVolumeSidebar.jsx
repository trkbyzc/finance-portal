import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../../../../../hooks/useMarketData.js';
import { useNavigate } from 'react-router-dom';
import MiniSparkline from './MiniSparkline';
import { formatCompactVolume } from './volumeFormat';

const SPARK_BLUE = '#3b82f6';

/**
 * En yüksek hacim sidebar'ı — top 4 BIST hissesi (volume × price = işlem hacmi TL).
 *
 * Tasarımda sparkline + progress bar birlikte yok ama biz hem trend (sparkline)
 * hem büyüklük karşılaştırması (progress bar) gösterelim — yatırımcı için ekstra info.
 * Yatırımcı sinyali: hacimli alım sahte fiyat hareketlerinden ayırır.
 */
export default function HighestVolumeSidebar() {
    const { data: stocks, loading: isLoading } = useMarketData('tr-stocks');
    const navigate = useNavigate();
    const { t } = useTranslation('markets');

    const topVolume = useMemo(() => {
        if (!stocks.length) return [];
        const enriched = stocks.map(s => {
            const price = s.price ?? s.regularMarketPrice ?? 0;
            const vol = Number(s.volume ?? 0);
            return { ...s, _tlVolume: price * vol };
        });
        return [...enriched]
            .sort((a, b) => b._tlVolume - a._tlVolume)
            .slice(0, 4);
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
                    return (
                        <div
                            key={stock.symbol}
                            onClick={() => navigate(`/chart/${encodeURIComponent(stock.symbol)}?cat=STOCK`)}
                            className="cursor-pointer group"
                        >
                            <div className="flex items-center justify-between gap-3 mb-1.5">
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-text text-sm group-hover:text-primary transition">
                                        {stock.symbol.replace('.IS', '')}
                                    </span>
                                    <span className="text-[10px] text-text-muted truncate max-w-25">
                                        {stock.name || ''}
                                    </span>
                                </div>

                                <div className="shrink-0">
                                    <MiniSparkline symbol={stock.symbol} color={SPARK_BLUE} width={70} height={24} />
                                </div>

                                <div className="flex flex-col items-end shrink-0 text-xs">
                                    <span className="font-mono font-bold text-text">₺{price.toFixed(2)}</span>
                                    <span className="font-mono font-bold text-primary">
                                        {formatCompactVolume(stock._tlVolume)} ₺
                                    </span>
                                </div>
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
