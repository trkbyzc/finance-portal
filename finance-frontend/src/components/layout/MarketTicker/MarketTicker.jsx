import React, { useMemo } from 'react';
import TickerItem from './components/TickerItem';
import TickerStyles from './components/TickerStyles';
import { useTickerData } from '../../../hooks/useTickerData';

// 🚀 FAZA 1: useEffect ve axios kaldırıldı, custom hook kullanılıyor
export default function MarketTicker() {
    const { tickerData: rawData } = useTickerData();

    // Business Logic: Ticker formatına dönüştür
    const tickerData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];

        return rawData.map(asset => {
            // Farklı asset tiplerini normalize et
            if (asset.currencyCode) {
                return {
                    name: asset.currencyCode === 'USD' ? 'USD/TRY' : asset.currencyCode,
                    price: asset.forexSelling || asset.price,
                    change: asset.changePercent
                };
            }
            if (asset.symbol) {
                return {
                    name: asset.symbol.replace('.IS', ''),
                    price: asset.price,
                    change: asset.changePercent
                };
            }
            return {
                name: asset.name || 'N/A',
                price: asset.price,
                change: asset.changePercent
            };
        });
    }, [rawData]);

    if (tickerData.length === 0) return null;

    // Kesintisiz döngü için veriyi 4 kez tekrarlıyoruz
    const extendedData = [...tickerData, ...tickerData, ...tickerData, ...tickerData];

    return (
        <div className="w-full bg-[#131722] border-b border-[#2a2e39] py-2 overflow-hidden flex ticker-wrap select-none shrink-0 z-40 relative">
            <TickerStyles />
            <div className="ticker-container">
                {extendedData.map((asset, idx) => (
                    <TickerItem
                        key={idx}
                        name={asset.name}
                        price={asset.price}
                        change={asset.change}
                    />
                ))}
            </div>
        </div>
    );
}