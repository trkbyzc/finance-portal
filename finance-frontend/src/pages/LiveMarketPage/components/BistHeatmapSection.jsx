import React, { useMemo } from 'react';
import { Treemap, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Loader2 } from 'lucide-react';

const TOP_N = 40; // okunabilirlik için en yüksek hacimli ilk N hisse

const shortSym = (s) => (s || '').replace('.IS', '');

/**
 * Treemap hücresi — boyut hacimden (recharts), renk günlük değişimden (tema buy/sell).
 * Değişim, sembol→değişim map'inden okunur (recharts node alanlarına bağımlı kalmamak için).
 */
function HeatCell(props) {
    const { x, y, width, height, name, depth, changeMap } = props;
    if (depth === 0 || width <= 0 || height <= 0) return null; // kök düğümü atla
    const c = Number(changeMap?.[name]) || 0;
    const up = c >= 0;
    const intensity = Math.max(0.28, Math.min(1, 0.28 + Math.abs(c) / 8));
    const showText = width > 42 && height > 26;
    const fs = Math.max(9, Math.min(13, width / 5));
    return (
        <g style={{ cursor: 'pointer' }}>
            <rect
                x={x} y={y} width={width} height={height} rx={3}
                fill={up ? 'var(--color-buy)' : 'var(--color-sell)'}
                fillOpacity={intensity}
                stroke="var(--color-surface)" strokeWidth={2}
            />
            {showText && (
                <>
                    <text x={x + width / 2} y={y + height / 2 - 3} textAnchor="middle" fill="#fff" fontSize={fs} fontWeight="700">
                        {shortSym(name)}
                    </text>
                    <text x={x + width / 2} y={y + height / 2 + fs} textAnchor="middle" fill="#fff" fontSize={fs - 2} fontWeight="600" opacity={0.95}>
                        {up ? '+' : ''}{c.toFixed(1)}%
                    </text>
                </>
            )}
        </g>
    );
}

/**
 * BIST hisse ısı haritası — hücre boyutu TL işlem hacmine, rengi günlük % değişime göre.
 * (Finviz/Bloomberg tarzı.) Sektör verisi olmadığından hacme göre boyutlanır.
 */
export default function BistHeatmapSection({ stocks, loading }) {
    const navigate = useNavigate();
    const { t } = useTranslation('markets');

    const { data, changeMap } = useMemo(() => {
        const list = (stocks || [])
            .map(s => ({
                name: s.symbol,
                value: (Number(s.price) || 0) * Number(s.volume || 0), // TL hacim
                change: Number(s.changePercent) || 0
            }))
            .filter(s => s.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, TOP_N);
        const cm = {};
        list.forEach(s => { cm[s.name] = s.change; });
        return { data: list, changeMap: cm };
    }, [stocks]);

    return (
        <div className="mb-12">
            <h2 className="text-2xl font-bold mb-1 text-text flex items-center gap-2 flex-wrap">
                {t('live.heatmap', 'BIST Isı Haritası')} <ChevronRight className="text-text-muted" size={24} />
                {data.length > 0 && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-md px-2 py-0.5">
                        {t('live.heatmapTopN', 'en yüksek hacimli {{n}}', { n: data.length })}
                    </span>
                )}
            </h2>
            <p className="text-xs text-text-muted mb-4">
                {t('live.heatmapSub', 'Kutu boyutu işlem hacmine, renk günlük değişime göre · ')}
                <span className="text-buy font-semibold">{t('live.heatmapUp', 'yeşil yükselen')}</span>
                {' · '}
                <span className="text-sell font-semibold">{t('live.heatmapDown', 'kırmızı düşen')}</span>
            </p>

            {loading ? (
                <div className="h-105 flex items-center justify-center text-text-muted bg-surface border border-border rounded-2xl">
                    <Loader2 className="animate-spin" size={26} />
                </div>
            ) : data.length === 0 ? (
                <div className="h-105 flex items-center justify-center text-text-muted bg-surface border border-border rounded-2xl">
                    {t('common:status.noData', 'Veri yok')}
                </div>
            ) : (
                <div className="bg-surface border border-border rounded-2xl p-2 shadow-lg">
                    <ResponsiveContainer width="100%" height={420}>
                        <Treemap
                            data={data}
                            dataKey="value"
                            aspectRatio={4 / 3}
                            isAnimationActive={false}
                            content={<HeatCell changeMap={changeMap} />}
                            onClick={(node) => node?.name && navigate(`/chart/${encodeURIComponent(node.name)}?cat=STOCK`)}
                        />
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
