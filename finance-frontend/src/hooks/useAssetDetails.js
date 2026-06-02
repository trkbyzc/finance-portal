import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { bondFundApi, aggregateApi } from '../services/api';
import { detectCategoryFromSymbol, marketsKeyForCategory } from '../utils/categoryUtils';
import { detectNativeCurrency, isYieldAsset } from '../utils/currencyConversion';

const GLOBAL_ETFS = ["SPY", "GLD", "TLT", "VNQ", "DIA", "IWM", "VTI", "VOO"];

/** "TP.TRT030626K26" → "DİBS 03.06.2026" (ISIN içindeki DDMMYY vade tarihinden). */
const parseTrBondName = (symbol) => {
    const isin = symbol.startsWith('TP.') ? symbol.slice(3) : symbol;
    if (isin.length < 9) return symbol;
    const dd = isin.slice(3, 5), mm = isin.slice(5, 7), yy = isin.slice(7, 9);
    if (!/^\d{2}$/.test(dd) || !/^\d{2}$/.test(mm) || !/^\d{2}$/.test(yy)) return symbol;
    return `DİBS ${dd}.${mm}.20${yy}`;
};

/**
 * Tek bir sembolün allMarketsData içindeki ilk uygun match'ini bulur.
 */
const findInMarkets = (allMarketsData, symbol, preferredKeys) => {
    if (!allMarketsData || !symbol) return null;
    const target = symbol.toUpperCase();

    const matchFn = (item) =>
        (item.symbol || '').toUpperCase() === target ||
        (item.yahooSymbol || '').toUpperCase() === target ||
        (item.currencyCode || '').toUpperCase() === target;

    // 1) Tercih edilen kategori(ler) varsa önce orada ara
    if (preferredKeys) {
        const keys = Array.isArray(preferredKeys) ? preferredKeys : [preferredKeys];
        for (const key of keys) {
            const arr = allMarketsData[key];
            if (Array.isArray(arr)) {
                const found = arr.find(matchFn);
                if (found) return { ...found, _matchedKey: key };
            }
        }
    }

    // 2) Currencies özel olarak ele alınmaya devam ediliyor (geriye uyumluluk)
    if (Array.isArray(allMarketsData.currencies)) {
        const found = allMarketsData.currencies.find(matchFn);
        if (found) return { ...found, _matchedKey: 'currencies' };
    }

    // 3) Son çare global fallback — Object.values
    const categories = Object.entries(allMarketsData).filter(([, v]) => Array.isArray(v));
    for (const [key, arr] of categories) {
        const found = arr.find(matchFn);
        if (found) return { ...found, _matchedKey: key };
    }

    return null;
};

/**
 * Markets array key'inden Asset.assetCategory enum'una map.
 */
// Backend key'lerinin (allMarketsData) → frontend assetCategory enum map'i.
// Backend keys: cryptos, global_bonds, tr_bonds, eurobonds, global_funds, tr_funds, vs.
const ASSET_CATEGORY_FROM_KEY = {
    stocks: 'STOCK',
    cryptos: 'CRYPTO',
    currencies: 'CURRENCY',
    global_bonds: 'BOND',
    tr_bonds: 'TR_BOND',
    eurobonds: 'EUROBOND',
    viop: 'VIOP',
    global_funds: 'FUND',
    tr_funds: 'TR_FUND',
    commodities: 'COMMODITY',
    indices: 'INDEX'
};

export const useAssetDetails = (symbol) => {
    const decodedSymbol = decodeURIComponent(symbol || "");
    const [searchParams] = useSearchParams();
    const urlCategory = (searchParams.get('cat') || '').toUpperCase() || null;

    const isTrBond = decodedSymbol.startsWith("TP.");
    const isEurobond = urlCategory === 'EUROBOND' || decodedSymbol.toUpperCase().endsWith('_EUROBOND');
    // VIOP sembolleri "VADE" içerir veya "F_" ile başlar. Sadece "_" içermek yeterli değil
    // (örn. TR10Y_EUROBOND da "_" içeriyor ama VIOP değil).
    const isViop = !isEurobond && (decodedSymbol.toUpperCase().includes("VADE") || decodedSymbol.toUpperCase().startsWith("F_"));

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

    if (isTrBond) {
        const found = trBondsList.find(b => b.SERI_NO === decodedSymbol || b.symbol === decodedSymbol);
        if (found) {
            asset = { ...found, assetCategory: 'BOND', chartType: 'LINE', price: found.yield || found.price };
        } else {
            // Katalogdan gelen bireysel DİBS (benchmark listesinde yok) — sembolden ad türet.
            // Grafik, vade kovasının benchmark eğrisini gösterir (bireysel getiri açık kaynakta yok).
            asset = {
                symbol: decodedSymbol,
                name: parseTrBondName(decodedSymbol),
                assetCategory: 'BOND',
                chartType: 'LINE'
            };
        }
    } else if (allMarketsData) {
        // 🚀 Kategori belirleme önceliği: URL ?cat= > sembol pattern > global fallback
        const detectedCategory = urlCategory || detectCategoryFromSymbol(decodedSymbol);
        const preferredKeys = marketsKeyForCategory(detectedCategory);

        const found = findInMarkets(allMarketsData, decodedSymbol, preferredKeys);
        if (found) {
            asset = { ...found };
            // Match yapılan listeye göre assetCategory'i kesinleştir
            const categoryFromKey = ASSET_CATEGORY_FROM_KEY[found._matchedKey];
            if (categoryFromKey) {
                asset.assetCategory = categoryFromKey;
            }
            delete asset._matchedKey;
        }
    }

    // Fallback default: hiç bulunamadıysa pattern'a göre kategori tahmini yap
    if (!asset && decodedSymbol) {
        const guessedCategory = urlCategory || detectCategoryFromSymbol(decodedSymbol) || 'STOCK';
        asset = {
            symbol: decodedSymbol,
            yahooSymbol: decodedSymbol,
            name: decodedSymbol,
            assetCategory: guessedCategory
        };
    }

    // TRY/USD toggle için asset'e displayPrice + nativeCurrency derive et
    if (asset) {
        const rawPrice = asset.price ?? asset.forexSelling ?? asset.yield ?? 0;
        asset.displayPrice = Number(rawPrice) || 0;
        asset.nativeCurrency = detectNativeCurrency(asset);
        asset.isYieldBased = isYieldAsset(asset);
    }

    const loading = isTrBond ? bondLoading : marketLoading;

    return {
        asset,
        trBondsList,
        loading,
        isTrBond,
        isViop: isViop || asset?.assetCategory === 'VIOP',
        isGlobalFund: GLOBAL_ETFS.includes(decodedSymbol),
        decodedSymbol
    };
};
