import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { historicalApi } from '../../../../services/api';
import { stockApi } from '../../../../services/api/stockApi';
import { BIST_OPTIONS, CRYPTO_OPTIONS, sectorIndexFor } from '../tradingChartConstants';

// Ana grafikle AYNI range→interval eşlemesi (useChartData ile uyumlu) — aksi halde benchmark
// her zaman günlük ('1d') çekilip 1G/1H gibi intraday aralıklarda düz 2-nokta çizgi oluyordu.
const getIntervalForRange = (range) => {
    const r = (range || '').toLowerCase();
    if (r === '1d' || r === '1g') return '15m';
    if (r === '5d' || r === '1w' || r === '1h') return '60m';
    if (r === '5y') return '1wk';
    return '1d';
};
const normalizeRange = (range) => {
    const r = (range || '').toLowerCase();
    if (r === '1g') return '1d';
    if (r === '1h') return '1mo';
    if (r === '1a') return '1mo';
    if (r === '3a') return '3mo';
    if (r === '6a') return '6mo';
    return r;
};

/**
 * BIST ve Crypto benchmark overlay'lerini yöneten tek hook.
 *
 * TR hisseleri için: BIST 100/50/30 toggle butonları → seçilen endekslerin Fintables'tan
 * % normalize edilmiş tarihsel verisi.
 * Kriptolar için: BITW (Bitwise Top 10) toggle butonu → Yahoo'dan % normalize.
 *
 * Returns:
 *   isTrStock, isCrypto              — asset bazlı flag'ler (kontrolün hangi bar'ı göstereceği)
 *   activeBists, toggleBist          — BIST seçim state'i
 *   activeCryptoBench, toggleCryptoBench
 *   showOverlayChart                 — overlay görünür mü (en az 1 benchmark seçili + ilgili tip ise)
 *   overlayChartData                 — recharts'a verilecek tarih-bazlı array
 *   overlayBenchmarks                — aktif benchmark option'ları (label/color erişimi için)
 */
export default function useBenchmarkOverlay({ asset, rawChartData, activeRange, customStartDate, customEndDate }) {
    const isTrStock = useMemo(() => {
        const sym = (asset?.symbol || asset?.yahooSymbol || '').toUpperCase();
        return sym.endsWith('.IS') && asset?.assetCategory !== 'INDEX' && !sym.startsWith('X');
    }, [asset]);

    const isCrypto = useMemo(() => asset?.assetCategory === 'CRYPTO', [asset]);

    // Hisse sektörünü temel veri endpoint'inden al (StockFundamentals kartıyla AYNI query key → tek istek).
    // Sektöre göre BIST KARŞILAŞTIR'a XBANK/XUSIN sektör endeksi EK olarak eklenir.
    const benchSymbol = asset?.yahooSymbol || asset?.symbol;
    const { data: fundamentals } = useQuery({
        queryKey: ['stockFundamentals', benchSymbol],
        queryFn: () => stockApi.getFundamentals(benchSymbol),
        enabled: isTrStock && !!benchSymbol,
        staleTime: 5 * 60 * 1000
    });
    const sectorOption = useMemo(() => sectorIndexFor(fundamentals?.sector), [fundamentals]);

    // XU100/50/30 + (varsa) sektör endeksi — tüm BIST hesapları bu dinamik listeyi kullanır.
    const bistOptions = useMemo(
        () => (sectorOption ? [...BIST_OPTIONS, sectorOption] : BIST_OPTIONS),
        [sectorOption]);

    const [activeBists, setActiveBists] = useState({ XU100: false, XU050: false, XU030: false });
    const [activeCryptoBench, setActiveCryptoBench] = useState({ BITW: false });

    const hasBistOverlay = useMemo(() => Object.values(activeBists).some(Boolean), [activeBists]);
    const hasCryptoOverlay = useMemo(() => Object.values(activeCryptoBench).some(Boolean), [activeCryptoBench]);

    const toggleBist = (key) => setActiveBists(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleCryptoBench = (key) => setActiveCryptoBench(prev => ({ ...prev, [key]: !prev[key] }));

    // BIST fetch
    const activeBistKeys = useMemo(() =>
        bistOptions.filter(b => activeBists[b.key]).map(b => b.symbol),
        [activeBists, bistOptions]);

    const { data: bistDataMap = {} } = useQuery({
        queryKey: ['bistOverlay', activeBistKeys.join(','), activeRange, customStartDate, customEndDate],
        queryFn: async () => {
            const results = {};
            await Promise.all(activeBistKeys.map(async (sym) => {
                try {
                    const params = activeRange === 'custom'
                        ? { symbol: sym, category: 'TR_INDEX', range: 'custom', interval: '1d', startDate: customStartDate, endDate: customEndDate }
                        : { symbol: sym, category: 'TR_INDEX', range: normalizeRange(activeRange), interval: getIntervalForRange(activeRange) };
                    const res = await historicalApi.getData(params);
                    results[sym] = Array.isArray(res) ? res : (res?.priceData || res || []);
                } catch (e) {
                    console.warn(`[BIST OVERLAY] ${sym} fetch hatası:`, e.message);
                    results[sym] = [];
                }
            }));
            return results;
        },
        enabled: hasBistOverlay && isTrStock,
        staleTime: 5 * 60 * 1000
    });

    // Crypto fetch
    const activeCryptoBenchKeys = useMemo(() =>
        CRYPTO_OPTIONS.filter(b => activeCryptoBench[b.key]).map(b => b.symbol),
        [activeCryptoBench]);

    const { data: cryptoBenchDataMap = {} } = useQuery({
        queryKey: ['cryptoBenchOverlay', activeCryptoBenchKeys.join(','), activeRange, customStartDate, customEndDate],
        queryFn: async () => {
            const results = {};
            await Promise.all(activeCryptoBenchKeys.map(async (sym) => {
                try {
                    const params = activeRange === 'custom'
                        ? { symbol: sym, category: 'INDEX', range: 'custom', interval: '1d', startDate: customStartDate, endDate: customEndDate }
                        : { symbol: sym, category: 'INDEX', range: normalizeRange(activeRange), interval: getIntervalForRange(activeRange) };
                    const res = await historicalApi.getData(params);
                    results[sym] = Array.isArray(res) ? res : (res?.priceData || res || []);
                } catch (e) {
                    console.warn(`[CRYPTO BENCH] ${sym} fetch hatası:`, e.message);
                    results[sym] = [];
                }
            }));
            return results;
        },
        enabled: hasCryptoOverlay && isCrypto,
        staleTime: 5 * 60 * 1000
    });

    // % normalize ve TIMESTAMP bazlı merge.
    // Eskiden gün bazlı (date.split('T')[0]) merge ediliyordu; bu, intraday (1G/1H) verileri tek
    // güne çökertip düz çizgi oluşturuyordu. Artık timestamp anahtarıyla intraday noktalar korunur.
    // x-ekseni `date` alanı timestamp (sayı) tutar — formatChartDate sayısal timestamp'i de işler.
    const buildNormalized = (options, activeMap, dataMap) => {
        if (!rawChartData?.length) return [];
        const out = {};

        const assetBase = rawChartData[0]?.close || 0;
        if (assetBase > 0) {
            rawChartData.forEach(p => {
                const ts = p.timestamp;
                if (ts == null) return;
                if (!out[ts]) out[ts] = { date: ts };
                out[ts].asset = Number((((p.close - assetBase) / assetBase) * 100).toFixed(2));
            });
        }

        options.forEach(({ key, symbol }) => {
            if (!activeMap[key]) return;
            const points = dataMap[symbol] || [];
            if (points.length === 0) return;
            const base = points[0]?.close ?? points[0]?.price ?? 0;
            if (base <= 0) return;
            points.forEach(p => {
                const ts = p.timestamp;
                const close = p.close ?? p.price ?? 0;
                if (ts == null || close <= 0) return;
                if (!out[ts]) out[ts] = { date: ts };
                out[ts][key] = Number((((close - base) / base) * 100).toFixed(2));
            });
        });

        return Object.values(out).sort((a, b) => a.date - b.date);
    };

    const bistOverlayChartData = useMemo(
        () => hasBistOverlay ? buildNormalized(bistOptions, activeBists, bistDataMap) : [],
        [hasBistOverlay, rawChartData, bistDataMap, activeBists, bistOptions]);

    const cryptoOverlayChartData = useMemo(
        () => hasCryptoOverlay ? buildNormalized(CRYPTO_OPTIONS, activeCryptoBench, cryptoBenchDataMap) : [],
        [hasCryptoOverlay, rawChartData, cryptoBenchDataMap, activeCryptoBench]);

    const showBistChart = hasBistOverlay && isTrStock;
    const showCryptoChart = hasCryptoOverlay && isCrypto;
    const showOverlayChart = showBistChart || showCryptoChart;

    const overlayChartData = showBistChart ? bistOverlayChartData : showCryptoChart ? cryptoOverlayChartData : [];
    const overlayBenchmarks = showBistChart
        ? bistOptions.filter(b => activeBists[b.key])
        : showCryptoChart
            ? CRYPTO_OPTIONS.filter(b => activeCryptoBench[b.key])
            : [];

    return {
        isTrStock,
        isCrypto,
        bistOptions,
        activeBists, toggleBist,
        activeCryptoBench, toggleCryptoBench,
        showOverlayChart,
        overlayChartData,
        overlayBenchmarks
    };
}
