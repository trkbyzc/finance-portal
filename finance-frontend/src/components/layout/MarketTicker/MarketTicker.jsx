import { useMemo, useRef, useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TickerItem from './components/TickerItem';
import TickerStyles from './components/TickerStyles';
import { useTickerData } from '../../../hooks/useTickerData';

export default function MarketTicker() {
    const { tickerData: rawData } = useTickerData();
    const { t } = useTranslation('markets');
    const wrapRef = useRef(null);
    const containerRef = useRef(null);
    // reps = bir "yarımdaki" set tekrarı. translateX(-50%) tam bir yarımı kaydırır; yarım
    // viewport'tan geniş olduğu sürece kuyruk hiç bitmez (boşluk gelmez). Ölçümle ayarlanır.
    const [reps, setReps] = useState(2);

    const tickerData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];

        return rawData.map(asset => {
            let finalName = asset.name || asset.symbol || asset.currencyCode || 'N/A';

            if (asset.currencyCode === 'USD' || asset.symbol === 'USD') finalName = 'USD/TRY';
            if (asset.currencyCode === 'EUR' || asset.symbol === 'EUR') finalName = 'EUR/TRY';
            if (asset.currencyCode === 'BTC' || asset.symbol === 'BTC') finalName = 'BTC/USD';
            if (asset.symbol === 'XU100' || asset.symbol === 'XU100.IS') finalName = 'BIST 100';
            if (asset.symbol === 'GAU' || (asset.name && asset.name.toUpperCase().includes('GRAM'))) finalName = t('gold.gramGold');

            return {
                name: finalName,
                price: asset.forexSelling || asset.price,
                change: asset.changePercent,
                symbol: asset._symbol || asset.symbol || asset.currencyCode || null,
                category: asset._category || null
            };
        });
    }, [rawData, t]);

    // Tek set genişliğini ölç → bir yarımın viewport'u doldurması için gereken tekrar sayısını bul.
    const measure = useCallback(() => {
        if (tickerData.length === 0 || !containerRef.current || !wrapRef.current) return;
        const totalSets = reps * 2;
        const setW = containerRef.current.scrollWidth / totalSets; // tek set genişliği (sabit)
        const wrapW = wrapRef.current.offsetWidth;
        if (setW > 0 && wrapW > 0) {
            const needed = Math.max(2, Math.ceil(wrapW / setW) + 1); // +1: tam sığma boşluğunu da kapat
            if (needed !== reps) setReps(needed);
        }
    }, [tickerData, reps]);

    useLayoutEffect(() => { measure(); }, [measure]);
    useEffect(() => {
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [measure]);

    if (tickerData.length === 0) return null;

    // İki özdeş yarım (reps×set) → translateX(-50%) sonunda ikinci yarım birincinin yerine geçer (seamless).
    const extendedData = Array.from({ length: reps * 2 }).flatMap(() => tickerData);
    const duration = reps * 20; // sabit hız (≈20s/set): yarım genişledikçe süre orantılı artar

    return (
        <div ref={wrapRef} className="w-full bg-surface border-b border-border py-2 overflow-hidden flex ticker-wrap select-none shrink-0 z-40 relative">
            <TickerStyles />
            <div ref={containerRef} className="ticker-container" style={{ animationDuration: `${duration}s` }}>
                {extendedData.map((asset, idx) => (
                    <TickerItem
                        key={idx}
                        name={asset.name}
                        price={asset.price}
                        change={asset.change}
                        symbol={asset.symbol}
                        category={asset.category}
                    />
                ))}
            </div>
        </div>
    );
}
