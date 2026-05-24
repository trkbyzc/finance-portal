import React, { useMemo } from 'react';
import TickerItem from './components/TickerItem';
import TickerStyles from './components/TickerStyles';
import { useTickerData } from '../../../hooks/useTickerData';

export default function MarketTicker() {
    const { tickerData: rawData } = useTickerData();

    // Business Logic: Ticker formatına dönüştür ve isimleri şıklaştır
    const tickerData = useMemo(() => {
        if (!rawData || rawData.length === 0) return [];

        return rawData.map(asset => {
            let finalName = asset.name || asset.symbol || asset.currencyCode || 'N/A';

            // 🚀 Ekranda havalı duracak özel isimlendirmeler
            if (asset.currencyCode === 'USD' || asset.symbol === 'USD') finalName = 'USD/TRY';
            if (asset.currencyCode === 'EUR' || asset.symbol === 'EUR') finalName = 'EUR/TRY';
            if (asset.currencyCode === 'BTC' || asset.symbol === 'BTC') finalName = 'BTC/USD';
            if (asset.symbol === 'XU100' || asset.symbol === 'XU100.IS') finalName = 'BIST 100';
            if (asset.symbol === 'GAU' || (asset.name && asset.name.toUpperCase().includes('GRAM'))) finalName = 'Gram Altın';

            return {
                name: finalName,
                price: asset.forexSelling || asset.price,
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