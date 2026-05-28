import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { historicalApi } from '../../../../services/api';
import { BIST_OPTIONS, CRYPTO_OPTIONS } from '../tradingChartConstants';

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

    const [activeBists, setActiveBists] = useState({ XU100: false, XU050: false, XU030: false });
    const [activeCryptoBench, setActiveCryptoBench] = useState({ BITW: false });

    const hasBistOverlay = useMemo(() => Object.values(activeBists).some(Boolean), [activeBists]);
    const hasCryptoOverlay = useMemo(() => Object.values(activeCryptoBench).some(Boolean), [activeCryptoBench]);

    const toggleBist = (key) => setActiveBists(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleCryptoBench = (key) => setActiveCryptoBench(prev => ({ ...prev, [key]: !prev[key] }));

    // BIST fetch
    const activeBistKeys = useMemo(() =>
        BIST_OPTIONS.filter(b => activeBists[b.key]).map(b => b.symbol),
        [activeBists]);

    const { data: bistDataMap = {} } = useQuery({
        queryKey: ['bistOverlay', activeBistKeys.join(','), activeRange, customStartDate, customEndDate],
        queryFn: async () => {
            const results = {};
            await Promise.all(activeBistKeys.map(async (sym) => {
                try {
                    const params = activeRange === 'custom'
                        ? { symbol: sym, category: 'TR_INDEX', range: 'custom', interval: '1d', startDate: customStartDate, endDate: customEndDate }
                        : { symbol: sym, category: 'TR_INDEX', range: activeRange, interval: '1d' };
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
                        : { symbol: sym, category: 'INDEX', range: activeRange, interval: '1d' };
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

    // % normalize ve tarih bazlı merge
    const buildNormalized = (options, activeMap, dataMap) => {
        if (!rawChartData?.length) return [];
        const out = {};
        const allDates = new Set();

        const assetBase = rawChartData[0]?.close || 0;
        if (assetBase > 0) {
            rawChartData.forEach(p => {
                const date = p.dateStr || p.date;
                if (!date) return;
                allDates.add(date);
                if (!out[date]) out[date] = {};
                out[date].asset = Number((((p.close - assetBase) / assetBase) * 100).toFixed(2));
            });
        }

        options.forEach(({ key, symbol }) => {
            if (!activeMap[key]) return;
            const points = dataMap[symbol] || [];
            if (points.length === 0) return;
            const base = points[0]?.close ?? points[0]?.price ?? 0;
            if (base <= 0) return;
            points.forEach(p => {
                let date = p.date || p.timestamp;
                if (Array.isArray(p.date)) {
                    date = `${p.date[0]}-${String(p.date[1]).padStart(2, '0')}-${String(p.date[2]).padStart(2, '0')}`;
                } else if (typeof date === 'string') {
                    date = date.split('T')[0];
                }
                const close = p.close ?? p.price ?? 0;
                if (!date || close <= 0) return;
                allDates.add(date);
                if (!out[date]) out[date] = {};
                out[date][key] = Number((((close - base) / base) * 100).toFixed(2));
            });
        });

        return Array.from(allDates).sort().map(date => ({ date, ...out[date] }));
    };

    const bistOverlayChartData = useMemo(
        () => hasBistOverlay ? buildNormalized(BIST_OPTIONS, activeBists, bistDataMap) : [],
        [hasBistOverlay, rawChartData, bistDataMap, activeBists]);

    const cryptoOverlayChartData = useMemo(
        () => hasCryptoOverlay ? buildNormalized(CRYPTO_OPTIONS, activeCryptoBench, cryptoBenchDataMap) : [],
        [hasCryptoOverlay, rawChartData, cryptoBenchDataMap, activeCryptoBench]);

    const showBistChart = hasBistOverlay && isTrStock;
    const showCryptoChart = hasCryptoOverlay && isCrypto;
    const showOverlayChart = showBistChart || showCryptoChart;

    const overlayChartData = showBistChart ? bistOverlayChartData : showCryptoChart ? cryptoOverlayChartData : [];
    const overlayBenchmarks = showBistChart
        ? BIST_OPTIONS.filter(b => activeBists[b.key])
        : showCryptoChart
            ? CRYPTO_OPTIONS.filter(b => activeCryptoBench[b.key])
            : [];

    return {
        isTrStock,
        isCrypto,
        activeBists, toggleBist,
        activeCryptoBench, toggleCryptoBench,
        showOverlayChart,
        overlayChartData,
        overlayBenchmarks
    };
}
