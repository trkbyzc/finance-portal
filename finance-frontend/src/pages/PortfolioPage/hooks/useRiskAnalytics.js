import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { historicalApi } from '../../../services/api';
import { historicalCategory } from '../../../utils/historicalPrice';

/**
 * Portföy risk & çeşitlendirme analitiği — tamamen frontend'de, mevcut /historical verisinden.
 *
 * Her holding için ~1 yıllık günlük kapanış serisi çekilir; ortak tarihlerde getiriler hesaplanır.
 * Ağırlıklar holdinglerin güncel TRY değerinden (calculateProfitLoss.currentValue) gelir.
 * BIST 100 (XU100) serisi beta için ayrıca çekilir.
 *
 * Döner: { loading, ready, metrics, correlation, weights, insufficient }
 *   metrics: { annVol, annReturn, sharpe, maxDrawdown, beta, hhi, effectiveAssets, topWeight, topSymbol }
 *   correlation: { symbols: [...], matrix: number[][] }   // -1..1
 */

const ANNUAL = 252;

const toIso = (p) => Array.isArray(p.date)
    ? `${p.date[0]}-${String(p.date[1]).padStart(2, '0')}-${String(p.date[2]).padStart(2, '0')}`
    : (typeof p.date === 'string' ? p.date.split('T')[0] : p.date);

/** Ham historical array → { isoDate: close } map (geçerli kapanışlar). */
const toCloseMap = (arr) => {
    const m = {};
    (arr || []).forEach(p => {
        const d = toIso(p);
        const c = Number(p.close ?? p.price ?? p.value);
        if (d && Number.isFinite(c) && c > 0) m[d] = c;
    });
    return m;
};

const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const stdev = (a) => {
    if (a.length < 2) return 0;
    const m = mean(a);
    return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};
const cov = (a, b) => {
    const n = Math.min(a.length, b.length);
    if (n < 2) return 0;
    const ma = mean(a), mb = mean(b);
    let s = 0;
    for (let i = 0; i < n; i++) s += (a[i] - ma) * (b[i] - mb);
    return s / (n - 1);
};
const corr = (a, b) => {
    const sa = stdev(a), sb = stdev(b);
    if (sa === 0 || sb === 0) return 0;
    return Math.max(-1, Math.min(1, cov(a, b) / (sa * sb)));
};
/** Hizalanmış kapanışlardan basit günlük getiri serisi. */
const returnsFromCloses = (closes) => {
    const r = [];
    for (let i = 1; i < closes.length; i++) r.push(closes[i] / closes[i - 1] - 1);
    return r;
};

export default function useRiskAnalytics(portfolio, calculateProfitLoss, enabled = true) {
    const holdings = useMemo(
        () => (portfolio || []).filter(h => h.symbol && h.quantity > 0),
        [portfolio]
    );

    const symbolsKey = holdings.map(h => `${h.assetType}:${h.symbol}`).join('|');

    const { data, isLoading } = useQuery({
        queryKey: ['riskAnalytics', symbolsKey],
        enabled: enabled && holdings.length > 0,
        staleTime: 5 * 60 * 1000,
        queryFn: async () => {
            // Tüm holding serileri + BIST100 paralel çekilir (1y, günlük)
            const fetchSeries = async (symbol, category) => {
                try {
                    const res = await historicalApi.getData({ symbol, category, range: '1y', interval: '1d' });
                    const arr = Array.isArray(res) ? res : (res?.priceData || res || []);
                    return toCloseMap(arr);
                } catch {
                    return {};
                }
            };
            const series = {};
            await Promise.all(holdings.map(async (h) => {
                const cat = historicalCategory(h.assetType, h.symbol);
                series[h.symbol] = cat ? await fetchSeries(h.symbol, cat) : {};
            }));
            const bist = await fetchSeries('XU100', 'TR_INDEX');
            return { series, bist };
        }
    });

    return useMemo(() => {
        const base = { loading: isLoading, ready: false, insufficient: false, metrics: null, correlation: null, weights: [] };
        if (!data || holdings.length === 0) return base;

        const { series, bist } = data;

        // Ağırlıklar — güncel TRY değeri
        const valued = holdings.map(h => ({
            symbol: h.symbol,
            value: Math.max(0, Number(calculateProfitLoss(h)?.currentValue) || 0)
        }));
        const totalValue = valued.reduce((s, v) => s + v.value, 0);
        if (totalValue <= 0) return base;
        const weights = valued.map(v => ({ symbol: v.symbol, w: v.value / totalValue }));

        // Tüm holdinglerde (ve BIST'te) ortak tarihler — getiri hizalaması için
        const symbols = holdings.map(h => h.symbol);
        const dateSets = symbols.map(s => new Set(Object.keys(series[s] || {})));
        let commonDates = dateSets.length ? [...dateSets[0]] : [];
        for (let i = 1; i < dateSets.length; i++) commonDates = commonDates.filter(d => dateSets[i].has(d));
        commonDates.sort();

        // En az ~20 getiri noktası gerekir
        if (commonDates.length < 21) {
            return { ...base, ready: true, insufficient: true, weights };
        }

        // Her holding için hizalı kapanış → getiri
        const retBySymbol = {};
        symbols.forEach(s => {
            const closes = commonDates.map(d => series[s][d]);
            retBySymbol[s] = returnsFromCloses(closes);
        });
        const nR = retBySymbol[symbols[0]].length;

        // Portföy getiri serisi (güncel ağırlıklarla)
        const wMap = Object.fromEntries(weights.map(x => [x.symbol, x.w]));
        const portRet = [];
        for (let t = 0; t < nR; t++) {
            let r = 0;
            symbols.forEach(s => { r += (wMap[s] || 0) * retBySymbol[s][t]; });
            portRet.push(r);
        }

        const annVol = stdev(portRet) * Math.sqrt(ANNUAL);
        const annReturn = mean(portRet) * ANNUAL;
        const sharpe = annVol > 0 ? annReturn / annVol : 0;

        // Maks. düşüş — getiriden equity curve
        let eq = 1, peak = 1, maxDD = 0;
        for (const r of portRet) {
            eq *= (1 + r);
            if (eq > peak) peak = eq;
            const dd = (eq - peak) / peak;
            if (dd < maxDD) maxDD = dd;
        }

        // Beta vs BIST100 (ortak tarihlerde)
        let beta = null;
        const bistCloses = commonDates.map(d => bist?.[d]).filter(c => Number.isFinite(c) && c > 0);
        if (bistCloses.length === commonDates.length && commonDates.length > 1) {
            const bistRet = returnsFromCloses(commonDates.map(d => bist[d]));
            const vBist = stdev(bistRet) ** 2;
            if (vBist > 0) beta = cov(portRet, bistRet) / vBist;
        }

        // Konsantrasyon — HHI, etkin varlık sayısı, en büyük ağırlık
        const hhi = weights.reduce((s, x) => s + x.w * x.w, 0);
        const effectiveAssets = hhi > 0 ? 1 / hhi : 0;
        const top = weights.reduce((a, b) => (b.w > a.w ? b : a), weights[0]);

        // Korelasyon matrisi
        const matrix = symbols.map(a => symbols.map(b => Number(corr(retBySymbol[a], retBySymbol[b]).toFixed(2))));

        return {
            loading: false,
            ready: true,
            insufficient: false,
            weights,
            metrics: {
                annVol, annReturn, sharpe, maxDrawdown: maxDD, beta,
                hhi, effectiveAssets, topWeight: top.w, topSymbol: top.symbol,
                dataPoints: nR
            },
            correlation: { symbols, matrix }
        };
    }, [data, isLoading, holdings, calculateProfitLoss]);
}
