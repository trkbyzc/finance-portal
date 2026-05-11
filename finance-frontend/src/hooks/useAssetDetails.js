import { useQuery } from '@tanstack/react-query';
import { bondFundApi, aggregateApi } from '../services/api';

const GLOBAL_ETFS = ["SPY", "GLD", "TLT", "VNQ", "DIA", "IWM", "VTI", "VOO"];

export const useAssetDetails = (symbol) => {
    const decodedSymbol = decodeURIComponent(symbol || "");

    const isTrBond = decodedSymbol.startsWith("TP.");
    const isViop = decodedSymbol.toUpperCase().includes("VADE") || decodedSymbol.toUpperCase().includes("_");
    const isGlobalFund = GLOBAL_ETFS.includes(decodedSymbol);

    const { data: trBondsList = [], isLoading: bondLoading } = useQuery({
        queryKey: ['trBondsDetail', decodedSymbol],
        queryFn: bondFundApi.getTrBonds,
        enabled: isTrBond,
        select: (data) => data?.value || data || []
    });

    const { data: allMarketsData, isLoading: marketLoading } = useQuery({
        queryKey: ['allMarketsForDetail', decodedSymbol],
        queryFn: aggregateApi.getAllMarkets,
        enabled: !isTrBond,
        staleTime: 60 * 1000
    });

    let asset = null;

    if (isTrBond && trBondsList.length > 0) {
        // 🚀 DÜZELTME: Tahvil objesini (BOND ve LINE meta datalarıyla) sanallaştırarak oluşturuyoruz.
        const found = trBondsList.find(b => b.SERI_NO === decodedSymbol || b.symbol === decodedSymbol) || trBondsList[0];
        if (found) {
            asset = {
                ...found,
                assetCategory: 'BOND',
                chartType: 'LINE',
                price: found.yield || found.price // Eskiden price alanında yield gösteriliyormuş
            };
        }
    }
    else if (allMarketsData) {
        // 🚀 ÖNCELİK SIRASI: Önce currencies'de ara (GBP gibi kodlar hem döviz hem fon olabilir)
        // 1. Currencies (Döviz) - En yüksek öncelik
        if (allMarketsData.currencies && Array.isArray(allMarketsData.currencies)) {
            const found = allMarketsData.currencies.find(item =>
                item.currencyCode === decodedSymbol ||
                item.symbol === decodedSymbol
            );
            if (found) {
                asset = { ...found };
            }
        }

        // 2. Eğer currencies'de bulunamadıysa, diğer kategorilerde ara
        if (!asset) {
            const categories = Object.values(allMarketsData).filter(Array.isArray);
            for (const dataArray of categories) {
                const found = dataArray.find(item =>
                    item.symbol === decodedSymbol ||
                    item.currencyCode === decodedSymbol ||
                    item.yahooSymbol === decodedSymbol
                );
                if (found) {
                    asset = { ...found }; // Kopyasını alıyoruz ki referans problemi olmasın
                    if (isViop) asset.assetCategory = 'VIOP';
                    break;
                }
            }
        }
    }

    const loading = isTrBond ? bondLoading : marketLoading;

    return {
        asset,
        trBondsList,
        loading,
        isTrBond,
        isViop,
        isGlobalFund,
        decodedSymbol
    };
};