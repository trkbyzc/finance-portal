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
    const [activeFng, setActiveFng] = useState(false); // Fear & Greed overlay (BITW ile tek-overlay, karşılıklı dışlamalı)

    const hasBistOverlay = useMemo(() => Object.values(activeBists).some(Boolean), [activeBists]);
    const hasCryptoOverlay = useMemo(() => Object.values(activeCryptoBench).some(Boolean), [activeCryptoBench]);

    const toggleBist = (key) => setActiveBists(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleCryptoBench = (key) => setActiveCryptoBench(prev => {
        const next = { ...prev, [key]: !prev[key] };
        if (next[key]) setActiveFng(false); // BITW açılınca F&G kapansın (tek overlay)
        return next;
    });
    const toggleFng = () => setActiveFng(prev => {
        const next = !prev;
        if (next) setActiveCryptoBench({ BITW: false }); // F&G açılınca BITW kapansın
        return next;
    });

    // Fear & Greed serisi (panelle AYNI query key → tek istek). Sadece aktif+kripto iken çekilir.
    const { data: fngSeries = [] } = useQuery({
        queryKey: ['fearGreed'],
        queryFn: async () => {
            const r = await stockApi.getFearGreed();
            return Array.isArray(r) ? r : (r?.data || []);
        },
        enabled: activeFng && isCrypto,
        staleTime: 60 * 60 * 1000
    });

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

    // % normalize ve hizalama.
    // x-ekseni VARLIĞIN kendi timestamp'leri olur (master). Benchmark'lar farklı timestamp/saniyede
    // gelebildiği için (Fintables kapanış vs. Yahoo kapanış), her benchmark değeri varlık
    // timestamp'lerine "forward-fill" ile taşınır: ts'i o ana kadarki en son benchmark değeri.
    // Böylece HER noktada hem varlık hem benchmark dolu olur → tooltip ve çizgi boşluksuz.
    const buildNormalized = (options, activeMap, dataMap) => {
        if (!rawChartData?.length) return [];

        const assetBase = rawChartData[0]?.close || 0;
        const rows = [];
        rawChartData.forEach(p => {
            const ts = p.timestamp;
            if (ts == null) return;
            const row = { date: ts };
            if (assetBase > 0) {
                row.asset = Number((((p.close - assetBase) / assetBase) * 100).toFixed(2));
            }
            rows.push(row);
        });
        rows.sort((a, b) => a.date - b.date);
        if (rows.length === 0) return [];

        options.forEach(({ key, symbol }) => {
            if (!activeMap[key]) return;
            const points = (dataMap[symbol] || [])
                .map(p => ({ ts: p.timestamp, close: p.close ?? p.price ?? 0 }))
                .filter(p => p.ts != null && p.close > 0)
                .sort((a, b) => a.ts - b.ts);
            if (points.length === 0) return;
            const base = points[0].close;
            if (base <= 0) return;

            // İki-işaretçili forward-fill: varlık timestamp'ine, ts'i <= o an olan en son benchmark.
            let i = 0;
            let lastVal = null;
            for (const row of rows) {
                while (i < points.length && points[i].ts <= row.date) {
                    lastVal = Number((((points[i].close - base) / base) * 100).toFixed(2));
                    i++;
                }
                if (lastVal !== null) row[key] = lastVal;
            }
        });

        return rows;
    };

    const bistOverlayChartData = useMemo(
        () => hasBistOverlay ? buildNormalized(bistOptions, activeBists, bistDataMap) : [],
        [hasBistOverlay, rawChartData, bistDataMap, activeBists, bistOptions]);

    const cryptoOverlayChartData = useMemo(
        () => hasCryptoOverlay ? buildNormalized(CRYPTO_OPTIONS, activeCryptoBench, cryptoBenchDataMap) : [],
        [hasCryptoOverlay, rawChartData, cryptoBenchDataMap, activeCryptoBench]);

    // Fear & Greed overlay verisi: varlık fiyatı (sol eksen) + F&G değeri (sağ 0-100), gün bazlı forward-fill.
    const fngOverlayData = useMemo(() => {
        if (!activeFng || !isCrypto || !rawChartData?.length || !fngSeries?.length) return [];
        const fngSorted = fngSeries
            .map(d => ({ ts: d.timestamp * 1000, v: d.value }))
            .filter(d => Number.isFinite(d.ts) && Number.isFinite(d.v))
            .sort((a, b) => a.ts - b.ts);
        if (!fngSorted.length) return [];
        const rows = rawChartData
            .filter(p => p.timestamp != null && p.close != null)
            .map(p => ({ date: p.timestamp, price: p.close }))
            .sort((a, b) => a.date - b.date);
        let i = 0, last = null;
        for (const row of rows) {
            while (i < fngSorted.length && fngSorted[i].ts <= row.date) { last = fngSorted[i].v; i++; }
            if (last != null) row.fng = last;
        }
        return rows.filter(r => r.fng != null);
    }, [activeFng, isCrypto, rawChartData, fngSeries]);

    const showBistChart = hasBistOverlay && isTrStock;
    const showCryptoChart = hasCryptoOverlay && isCrypto;
    const showFngChart = activeFng && isCrypto && fngOverlayData.length > 0;
    const showOverlayChart = showBistChart || showCryptoChart || showFngChart;

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
        activeFng, toggleFng,
        showFngChart,
        fngOverlayData,
        showOverlayChart,
        overlayChartData,
        overlayBenchmarks
    };
}
