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
 * Vadeli/türev (VİOP/FUTURE) ve yeterli ortak geçmişi olmayan varlıklar analizden HARİÇ tutulur
 * (kaldıraçlı türevlerde spot volatilite/beta/korelasyon yanıltıcıdır). Hariç tutulanlar `excluded`
 * ile döner; UI bir uyarıyla gösterir, panel komple boşalmaz.
 *
 * Döner: { loading, ready, metrics, correlation, weights, insufficient, excluded }
 *   metrics: { annVol, annReturn, sharpe, maxDrawdown, beta, hhi, effectiveAssets, topWeight, topSymbol }
 *   correlation: { symbols: [...], matrix: number[][] }   // -1..1
 *   excluded: [{ symbol, reason: 'derivative' | 'shortHistory' }]
 */

const ANNUAL = 252;
const MIN_POINTS = 22; // ~21 getiri noktası için en az 22 kapanış (≈1 ay)

const toIso = (p) => {
    if (Array.isArray(p.date)) {
        return `${p.date[0]}-${String(p.date[1]).padStart(2, '0')}-${String(p.date[2]).padStart(2, '0')}`;
    }
    if (typeof p.date === 'string') return p.date.split('T')[0];
    if (p.date) return p.date;
    // VİOP gibi `date` boş, yalnızca `timestamp` (epoch) dönen seriler → yerel takvim gününe çevir.
    const ts = p.timestamp ?? p.time;
    if (ts) {
        const ms = Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts);
        const d = new Date(ms);
        if (!Number.isNaN(d.getTime())) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
    }
    return null;
};

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

/** Beta vs benchmark. Tarihler benchmark ile hizalanır. Veri azsa null döner. */
const computeBeta = (commonDates, bist, series, symbols, wMap) => {
    const betaDates = commonDates.filter(d => Number.isFinite(bist?.[d]) && bist[d] > 0);
    if (betaDates.length < 21) return null;
    const portRetB = [];
    const bistRetB = [];
    for (let i = 1; i < betaDates.length; i++) {
        const d0 = betaDates[i - 1], d1 = betaDates[i];
        let rp = 0;
        symbols.forEach(s => {
            const c0 = series[s][d0], c1 = series[s][d1];
            if (c0 > 0 && c1 > 0) rp += (wMap[s] || 0) * (c1 / c0 - 1);
        });
        portRetB.push(rp);
        bistRetB.push(bist[d1] / bist[d0] - 1);
    }
    const vBist = stdev(bistRetB) ** 2;
    return vBist > 0 ? cov(portRetB, bistRetB) / vBist : null;
};

/** Portföy getiri serisinden equity curve üzerinden maks. drawdown. */
const computeMaxDrawdown = (portRet) => {
    let eq = 1, peak = 1, maxDD = 0;
    for (const r of portRet) {
        eq *= (1 + r);
        if (eq > peak) peak = eq;
        const dd = (eq - peak) / peak;
        if (dd < maxDD) maxDD = dd;
    }
    return maxDD;
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
        const base = { loading: isLoading, ready: false, insufficient: false, metrics: null, correlation: null, weights: [], excluded: [] };
        if (!data || holdings.length === 0) return base;

        const { series, bist } = data;

        // 1) Risk analizine UYGUN olmayanları ayıkla — panel komple boşalmasın, gösterilebilenler gösterilsin:
        //    - Vadeli/türev (FUTURE/VİOP): kaldıraçlı; spot volatilite/beta/korelasyon mantığına uymaz.
        //    - Yetersiz geçmiş: ~1 aylık (MIN_POINTS) kendi kapanış serisi bile olmayan varlık.
        const excluded = [];
        const eligible = [];
        holdings.forEach(h => {
            if (h.assetType === 'FUTURE') { excluded.push({ symbol: h.symbol, reason: 'derivative' }); return; }
            if (Object.keys(series[h.symbol] || {}).length < MIN_POINTS) { excluded.push({ symbol: h.symbol, reason: 'shortHistory' }); return; }
            eligible.push(h);
        });

        if (eligible.length === 0) {
            return { ...base, ready: true, insufficient: true, excluded };
        }

        // 2) Uygun varlıklarda ortak tarihler; yetersizse darboğaz (en kısa geçmişli) varlığı çıkararak daralt.
        const intersect = (hs) => {
            const sets = hs.map(h => new Set(Object.keys(series[h.symbol] || {})));
            let common = sets.length ? [...sets[0]] : [];
            for (let i = 1; i < sets.length; i++) common = common.filter(d => sets[i].has(d));
            return common;
        };
        const included = [...eligible];
        let commonDates = intersect(included);
        while (commonDates.length < 21 && included.length > 1) {
            included.sort((a, b) => Object.keys(series[a.symbol]).length - Object.keys(series[b.symbol]).length);
            const dropped = included.shift();
            excluded.push({ symbol: dropped.symbol, reason: 'shortHistory' });
            commonDates = intersect(included);
        }
        commonDates.sort((a, b) => a.localeCompare(b));
        if (commonDates.length < 21) {
            return { ...base, ready: true, insufficient: true, excluded };
        }

        // 3) Ağırlıklar — yalnızca DAHİL edilen varlıklar üzerinden (yeniden normalize edilir)
        const valued = included.map(h => ({
            symbol: h.symbol,
            value: Math.max(0, Number(calculateProfitLoss(h)?.currentValue) || 0)
        }));
        const totalValue = valued.reduce((s, v) => s + v.value, 0);
        if (totalValue <= 0) return base; // değersiz portföy → panel gizli (ready=false)
        const weights = valued.map(v => ({ symbol: v.symbol, w: v.value / totalValue }));

        const symbols = included.map(h => h.symbol);

        const retBySymbol = {};
        symbols.forEach(s => {
            const closes = commonDates.map(d => series[s][d]);
            retBySymbol[s] = returnsFromCloses(closes);
        });
        const nR = retBySymbol[symbols[0]].length;

        const wMap = Object.fromEntries(weights.map(x => [x.symbol, x.w]));
        const portRet = [];
        for (let tt = 0; tt < nR; tt++) {
            let r = 0;
            symbols.forEach(s => { r += (wMap[s] || 0) * retBySymbol[s][tt]; });
            portRet.push(r);
        }

        const annVol = stdev(portRet) * Math.sqrt(ANNUAL);
        const annReturn = mean(portRet) * ANNUAL;
        const sharpe = annVol > 0 ? annReturn / annVol : 0;

        const maxDD = computeMaxDrawdown(portRet);
        const beta = computeBeta(commonDates, bist, series, symbols, wMap);
        const hhi = weights.reduce((s, x) => s + x.w * x.w, 0);
        const effectiveAssets = hhi > 0 ? 1 / hhi : 0;
        const top = weights.reduce((a, b) => (b.w > a.w ? b : a), weights[0]);

        const matrix = symbols.map(a => symbols.map(b => Number(corr(retBySymbol[a], retBySymbol[b]).toFixed(2))));

        return {
            loading: false,
            ready: true,
            insufficient: false,
            weights,
            excluded,
            metrics: {
                annVol, annReturn, sharpe, maxDrawdown: maxDD, beta,
                hhi, effectiveAssets, topWeight: top.w, topSymbol: top.symbol,
                dataPoints: nR
            },
            correlation: { symbols, matrix }
        };
    }, [data, isLoading, holdings, calculateProfitLoss]);
}
