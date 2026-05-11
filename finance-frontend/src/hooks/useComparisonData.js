import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { historicalApi, aggregateApi } from '../services/api';

export const useComparisonData = (primaryYahoo, primaryLabel, actualAssetSymbol, isTrBond) => {
    const [comparisonAssets, setComparisonAssets] = useState([]);
    
    // 🚀 FAZA 1: useEffect kaldırıldı, useMemo ile derived state
    const range = useMemo(() => {
        return isTrBond ? 'ytd' : '3mo';
    }, [isTrBond]);
    
    const [customRange, setCustomRange] = useState(range);

    const allActiveAssets = [
        { yahooSymbol: primaryYahoo, label: primaryLabel, symbol: actualAssetSymbol || primaryYahoo },
        ...comparisonAssets
    ];

    // 🚀 Orijinal mantığınıza sadık kalarak, React Query üzerinden tüm dünyayı çekme
    const { data: allAssets = [], isLoading: allAssetsLoading } = useQuery({
        queryKey: ['allAssetsForComparison'],
        queryFn: async () => {
            try {
                const [data, trBondsData] = await Promise.all([
                    aggregateApi.getAllMarkets(),
                    aggregateApi.getMarketsByEndpoint('/tr-bonds').catch(() => ([]))
                ]);

                // Orijinal Kodunuz: Tahvilleri map'leme işlemi
                const mappedBonds = (trBondsData?.value || trBondsData || []).map(b => ({
                    symbol: b.symbol || b.SERI_NO,
                    yahooSymbol: b.symbol || b.SERI_NO,
                    name: b.name || b.label + " Tahvil"
                }));

                const combined = [
                    ...(data.indices || []), ...(data.stocks || []),
                    ...(data.crypto || []), ...(data.currencies || []),
                    ...(data.bonds || []), ...(data.viop || []),
                    ...(data.global_funds || []), ...(data.tr_funds || []),
                    ...(data.commodities || []), ...mappedBonds
                ].filter(item => item.yahooSymbol || item.symbol || item.currencyCode);

                // Orijinal Kodunuz: Aynı sembolden birden fazla olmaması için Set işlemi
                const uniqueAssets = [];
                const seen = new Set();

                combined.forEach(item => {
                    const ySym = item.yahooSymbol || item.symbol || item.currencyCode;
                    const cleanName = item.name || item.currencyName || ySym;

                    if (ySym && !seen.has(ySym)) {
                        seen.add(ySym);
                        uniqueAssets.push({
                            label: cleanName,
                            symbol: item.symbol || item.currencyCode || ySym,
                            yahooSymbol: ySym
                        });
                    }
                });
                return uniqueAssets;
            } catch (err) {
                console.error("Arama verisi çekilemedi:", err);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000
    });


    // 🚀 Orijinal mantığınıza TAMAMEN sadık kalarak, matematik formülünüzle geçmiş datayı çekme
    const { data: rawHistoricalData, isLoading: historyLoading } = useQuery({
        queryKey: ['historicalComparison', allActiveAssets.map(a => a.yahooSymbol).join(','), customRange],
        queryFn: async () => {
            const requests = allActiveAssets.map(ast =>
                historicalApi.getHistoricalData(ast.yahooSymbol, customRange)
                    .then(data => ({ sym: ast.label, data }))
            );
            return await Promise.all(requests);
        },
        enabled: allActiveAssets.length > 1 // Ancak eklenmiş bir asset varsa ateşle
    });

    // 🚀 FAZA 1: useEffect kaldırıldı, React Query'nin select özelliği ile data transformation
    const chartData = useMemo(() => {
        if (!rawHistoricalData || rawHistoricalData.length === 0) return [];

        const mergedByDate = {};

        rawHistoricalData.forEach(({ sym, data }) => {
            if (!Array.isArray(data)) return;
            const validData = data.filter(d => d.date && d.close != null).sort((a,b) => new Date(a.date) - new Date(b.date));
            if (validData.length === 0) return;

            const basePrice = Number(validData[0].close);

            validData.forEach(item => {
                const dateStr = item.date.split('T')[0];
                if (!mergedByDate[dateStr]) mergedByDate[dateStr] = { date: dateStr, timestamp: new Date(item.date).getTime() };

                const currentPrice = Number(item.close);
                const percentChange = basePrice === 0 ? 0 : ((currentPrice - basePrice) / basePrice) * 100;
                mergedByDate[dateStr][sym] = Number(percentChange.toFixed(2));
            });
        });

        return Object.values(mergedByDate)
            .filter(item => item.timestamp)
            .sort((a, b) => a.timestamp - b.timestamp);
    }, [rawHistoricalData]);

    const removeAsset = (yahooSymbol) => setComparisonAssets(prev => prev.filter(s => s.yahooSymbol !== yahooSymbol));
    const addAsset = (newAsset) => {
        if (newAsset && newAsset.yahooSymbol !== primaryYahoo && !comparisonAssets.some(c => c.yahooSymbol === newAsset.yahooSymbol)) {
            setComparisonAssets([...comparisonAssets, newAsset]);
        }
    };

    const isLoading = allAssetsLoading || historyLoading;

    return {
        comparisonAssets, addAsset, removeAsset,
        allAssets, chartData, isLoading, 
        range: customRange, 
        setRange: setCustomRange, 
        allActiveAssets
    };
};