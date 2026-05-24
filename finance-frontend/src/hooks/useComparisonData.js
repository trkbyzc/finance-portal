import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { historicalApi, aggregateApi, economyApi, currencyApi } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { detectNativeCurrency } from '../utils/currencyConversion';

// Enflasyon overlay'leri için sabit renkler (varlık paletinden ayrı dursun)
const TR_INFLATION_LABEL = 'TR Enflasyon';
const USD_INFLATION_LABEL = 'ABD Enflasyon';
const TR_INFLATION_COLOR = '#f23645';
const USD_INFLATION_COLOR = '#ff9800';

/**
 * Date → USDTRY rate hızlı lookup map'i + ortalama (fallback).
 * Eksik tarihler için en yakın (geriye doğru taranan) tarih kullanılır.
 */
const buildUsdTryRateLookup = (usdTryHistory) => {
    if (!Array.isArray(usdTryHistory) || usdTryHistory.length === 0) {
        return { lookup: new Map(), sortedDates: [], avg: 1 };
    }
    const lookup = new Map();
    let sum = 0, count = 0;
    usdTryHistory.forEach(p => {
        if (p?.date && p?.close != null) {
            const v = Number(p.close);
            if (v > 0) {
                lookup.set(p.date, v);
                sum += v;
                count++;
            }
        }
    });
    const sortedDates = Array.from(lookup.keys()).sort();
    return { lookup, sortedDates, avg: count > 0 ? sum / count : 1 };
};

/**
 * Belirli bir tarih için USDTRY kuru bulur. Tam tarih yoksa en yakın eski tarihi alır,
 * o da yoksa ortalama döner. (Hafta sonu/tatil günleri için graceful fallback.)
 */
const findRateForDate = (lookup, sortedDates, avg, dateStr) => {
    if (lookup.has(dateStr)) return lookup.get(dateStr);
    // Binary search değil ama lineer — küçük lookup'lar için yeterli
    // Geriye doğru en yakın
    for (let i = sortedDates.length - 1; i >= 0; i--) {
        if (sortedDates[i] <= dateStr) return lookup.get(sortedDates[i]);
    }
    // Hiçbir geçmiş tarih yoksa en eskiyi al
    if (sortedDates.length > 0) return lookup.get(sortedDates[0]);
    return avg;
};

export const useComparisonData = (primaryYahoo, primaryLabel, actualAssetSymbol, isTrBond, primaryCategory) => {
    const [comparisonAssets, setComparisonAssets] = useState([]);
    const [trInflationActive, setTrInflationActive] = useState(false);
    const [usdInflationActive, setUsdInflationActive] = useState(false);

    // 🆕 Görüntüleme modu: 'percent' (yüzde cumulative) veya 'price' (raw fiyat — log scale)
    const [mode, setMode] = useState('percent');

    // Global currency state — ComparisonSection + AssetHeader + TradingChart hepsi aynı state'i paylaşır
    const { currency, setCurrency } = useCurrency();

    const range = useMemo(() => (isTrBond ? 'ytd' : '3mo'), [isTrBond]);
    const [customRange, setCustomRange] = useState(range);

    const allActiveAssets = useMemo(() => ([
        { yahooSymbol: primaryYahoo, label: primaryLabel, symbol: actualAssetSymbol || primaryYahoo, category: primaryCategory || 'UNKNOWN' },
        ...comparisonAssets
    ]), [primaryYahoo, primaryLabel, actualAssetSymbol, primaryCategory, comparisonAssets]);

    const { data: allAssets = [], isLoading: allAssetsLoading } = useQuery({
        queryKey: ['allAssetsForComparison'],
        queryFn: async () => {
            try {
                const [data, trBondsData] = await Promise.all([
                    aggregateApi.getAllMarkets(),
                    aggregateApi.getMarketsByEndpoint('/tr-bonds').catch(() => ([]))
                ]);

                const addCat = (arr, cat) => (arr || []).map(item => ({ ...item, assetCategory: cat }));

                const mappedBonds = (trBondsData?.value || trBondsData || []).map(b => ({
                    symbol: b.symbol || b.SERI_NO,
                    yahooSymbol: b.symbol || b.SERI_NO,
                    name: b.name || b.label + " Tahvil",
                    assetCategory: 'TR_BOND'
                }));

                // Backend key'leri: cryptos (crypto değil), global_bonds (bonds değil), eurobonds, vs.
                const combined = [
                    ...addCat(data.indices, 'INDEX'),
                    ...addCat(data.stocks, 'STOCK'),
                    ...addCat(data.cryptos, 'CRYPTO'),
                    ...addCat(data.currencies, 'CURRENCY'),
                    ...addCat(data.global_bonds, 'BOND'),
                    ...addCat(data.eurobonds, 'EUROBOND'),
                    ...addCat(data.viop, 'VIOP'),
                    ...addCat(data.global_funds, 'FUND'),
                    ...addCat(data.tr_funds, 'TR_FUND'),
                    ...addCat(data.commodities, 'COMMODITY'),
                    ...mappedBonds
                ].filter(item => item.yahooSymbol || item.symbol || item.currencyCode);

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
                            yahooSymbol: ySym,
                            category: item.assetCategory || 'UNKNOWN'
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

    const { data: rawHistoricalData, isLoading: historyLoading } = useQuery({
        queryKey: ['historicalComparison', allActiveAssets.map(a => a.yahooSymbol).join(','), customRange],
        queryFn: async () => {
            const requests = allActiveAssets.map(ast =>
                historicalApi.getData({
                    symbol: ast.yahooSymbol,
                    range: customRange,
                    interval: '1d',
                    category: ast.category
                }).then(res => {
                    const dataArray = Array.isArray(res) ? res : (res?.priceData || res || []);
                    return { sym: ast.label, data: dataArray, asset: ast };
                })
            );
            return await Promise.all(requests);
        },
        enabled: allActiveAssets.length > 1 || trInflationActive || usdInflationActive
    });

    // TR enflasyon (cumulative CPI endeksi) — sadece toggle açıkken fetch
    const { data: trInflationData, isLoading: trInflationLoading } = useQuery({
        queryKey: ['trCumulativeInflation', customRange],
        queryFn: () => economyApi.getCumulativeInflation(customRange),
        enabled: trInflationActive,
        staleTime: 10 * 60 * 1000
    });

    // USD enflasyon (FRED CPI) — sadece toggle açıkken fetch
    const { data: usdInflationData, isLoading: usdInflationLoading } = useQuery({
        queryKey: ['usdInflation', customRange],
        queryFn: () => economyApi.getEconomyUsHistorical(customRange),
        enabled: usdInflationActive,
        staleTime: 10 * 60 * 1000
    });

    // 🆕 USDTRY tarihsel kur serisi — historical conversion için
    // Karşılaştırmaya birden fazla varlık varsa veya enflasyon aktifse fetch
    const { data: usdTryHistory, isLoading: usdTryLoading } = useQuery({
        queryKey: ['usdTryHistorical', customRange],
        queryFn: () => currencyApi.getCurrencyHistorical('USD', customRange),
        enabled: allActiveAssets.length > 1 || trInflationActive || usdInflationActive,
        staleTime: 30 * 60 * 1000
    });

    const usdTryLookup = useMemo(() => buildUsdTryRateLookup(usdTryHistory), [usdTryHistory]);

    /**
     * Bir asset'in raw price'ını seçilen currency'e çevirir.
     * Conversion her tarih için o tarihteki USDTRY kuruyla yapılır (historical, point-by-point).
     */
    const convertPriceAt = useCallback((rawPrice, nativeCurrency, dateStr) => {
        if (!rawPrice || nativeCurrency === currency) return rawPrice;
        const rate = findRateForDate(usdTryLookup.lookup, usdTryLookup.sortedDates, usdTryLookup.avg, dateStr);
        if (!rate || rate <= 0) return rawPrice;
        if (currency === 'TRY' && nativeCurrency === 'USD') return rawPrice * rate;
        if (currency === 'USD' && nativeCurrency === 'TRY') return rawPrice / rate;
        return rawPrice;
    }, [currency, usdTryLookup]);

    const chartData = useMemo(() => {
        const allSeries = [];

        if (Array.isArray(rawHistoricalData)) {
            rawHistoricalData.forEach(s => allSeries.push({ ...s, isInflation: false }));
        }
        if (trInflationActive && Array.isArray(trInflationData) && trInflationData.length > 0) {
            allSeries.push({ sym: TR_INFLATION_LABEL, data: trInflationData, isInflation: true });
        }
        if (usdInflationActive && Array.isArray(usdInflationData) && usdInflationData.length > 0) {
            allSeries.push({ sym: USD_INFLATION_LABEL, data: usdInflationData, isInflation: true });
        }
        if (allSeries.length === 0) return [];

        const assetMap = {};
        const allDatesSet = new Set();

        allSeries.forEach(({ sym, data, isInflation, asset }) => {
            if (!Array.isArray(data) || data.length === 0) return;

            // Enflasyon serileri raw endeks — currency conversion uygulanmaz (zaten % bazlı)
            const nativeCurrency = isInflation ? null : detectNativeCurrency(asset);

            const parsedData = data.map(item => {
                let dateStr = item.date || item.timestamp;
                if (Array.isArray(item.date)) {
                    dateStr = `${item.date[0]}-${String(item.date[1]).padStart(2, '0')}-${String(item.date[2]).padStart(2, '0')}`;
                } else if (typeof dateStr === 'string') {
                    dateStr = dateStr.split('T')[0];
                }

                const rawPrice = Number(item.close ?? item.price ?? item.value ?? 0);
                const price = isInflation
                    ? rawPrice
                    : convertPriceAt(rawPrice, nativeCurrency, dateStr);
                return { date: dateStr, price };
            }).filter(d => d.date && d.price > 0).sort((a, b) => new Date(a.date) - new Date(b.date));

            if (parsedData.length === 0) return;

            assetMap[sym] = {
                basePrice: parsedData[0].price,
                dataDict: {},
                lastKnownPrice: parsedData[0].price
            };

            parsedData.forEach(item => {
                assetMap[sym].dataDict[item.date] = item.price;
                allDatesSet.add(item.date);
            });
        });

        const sortedDates = Array.from(allDatesSet).sort((a, b) => new Date(a) - new Date(b));

        return sortedDates.map(dateStr => {
            const dataPoint = { date: dateStr, timestamp: new Date(dateStr).getTime() };
            Object.keys(assetMap).forEach(sym => {
                const ast = assetMap[sym];
                if (ast.dataDict[dateStr] !== undefined) {
                    ast.lastKnownPrice = ast.dataDict[dateStr];
                }
                const currentPrice = ast.lastKnownPrice;
                if (mode === 'price') {
                    // Raw fiyat — log scale için pozitif olmak zorunda
                    dataPoint[sym] = Number(currentPrice.toFixed(currentPrice < 1 ? 6 : 2));
                } else {
                    const percentChange = ast.basePrice === 0 ? 0 : ((currentPrice - ast.basePrice) / ast.basePrice) * 100;
                    dataPoint[sym] = Number(percentChange.toFixed(2));
                }
            });
            return dataPoint;
        });
    }, [rawHistoricalData, trInflationActive, trInflationData, usdInflationActive, usdInflationData, convertPriceAt, mode]);

    const removeAsset = (yahooSymbol) => setComparisonAssets(prev => prev.filter(s => s.yahooSymbol !== yahooSymbol));
    const addAsset = (newAsset) => {
        if (newAsset && newAsset.yahooSymbol !== primaryYahoo && !comparisonAssets.some(c => c.yahooSymbol === newAsset.yahooSymbol)) {
            setComparisonAssets([...comparisonAssets, newAsset]);
        }
    };

    // 🆕 Auto-switch: TR Enflasyon aktif edilince currency = TRY, ABD Enflasyon aktif edilince currency = USD
    const toggleTrInflation = () => {
        setTrInflationActive(prev => {
            const next = !prev;
            if (next) setCurrency('TRY');
            return next;
        });
    };
    const toggleUsdInflation = () => {
        setUsdInflationActive(prev => {
            const next = !prev;
            if (next) setCurrency('USD');
            return next;
        });
    };

    const inflationSeries = useMemo(() => ([
        { label: TR_INFLATION_LABEL, color: TR_INFLATION_COLOR, active: trInflationActive },
        { label: USD_INFLATION_LABEL, color: USD_INFLATION_COLOR, active: usdInflationActive }
    ].filter(s => s.active)), [trInflationActive, usdInflationActive]);

    const isLoading = allAssetsLoading || historyLoading || trInflationLoading || usdInflationLoading || usdTryLoading;

    return {
        comparisonAssets, addAsset, removeAsset,
        allAssets, chartData, isLoading,
        range: customRange,
        setRange: setCustomRange,
        allActiveAssets,
        trInflationActive, usdInflationActive,
        toggleTrInflation, toggleUsdInflation,
        inflationSeries,
        currency,
        // 🆕 Görüntüleme modu kontrolü: 'percent' veya 'price'
        mode, setMode
    };
};
