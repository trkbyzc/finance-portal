import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { historicalApi, currencyApi, economyApi } from '../services/api';

/**
 * Performans karşılaştırma widget'ı için veri hook'u (Midas tarzı): seçili varlık + sabit
 * benchmark'lar (BIST 100, Mevduat Faizi, Altın, Dolar) — her satır için seçili dönem % getirisi.
 *
 * Strateji: her seri 5y çekilir (1 kez, react-query cache), dönem değişimi client-side dilimleme
 * ile anında hesaplanır (ekstra istek yok). Fiyat satırları (son-ilk)/ilk; mevduat faizi EVDS
 * yıllık oran serisinin dönem boyunca BİLEŞİKLENMESİYLE (rolling deposit) bulunur.
 */
const FETCH_RANGE = '5y';

const isoOf = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

// Dönem → kesim tarihi (YYYY-MM-DD). TZ kaymasını önlemek için doğrudan string üretir.
const cutoffStr = (period) => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    switch (period) {
        case '1mo': return isoOf(new Date(y, m - 1, d));
        case '3mo': return isoOf(new Date(y, m - 3, d));
        case 'ytd': return `${y}-01-01`;
        case '1y': return isoOf(new Date(y - 1, m, d));
        case '3y': return isoOf(new Date(y - 3, m, d));
        case '5y': return isoOf(new Date(y - 5, m, d));
        default: return isoOf(new Date(y - 1, m, d));
    }
};

// historicalApi yanıtını [{date:'YYYY-MM-DD', price}] olarak normalize eder (artan sıralı).
const normalizeSeries = (raw) => {
    const arr = Array.isArray(raw) ? raw : (raw?.priceData || raw || []);
    if (!Array.isArray(arr)) return [];
    return arr.map(item => {
        let dateStr = item.date ?? item.timestamp;
        if (Array.isArray(item.date)) {
            dateStr = `${item.date[0]}-${String(item.date[1]).padStart(2, '0')}-${String(item.date[2]).padStart(2, '0')}`;
        } else if (typeof dateStr === 'string') {
            dateStr = dateStr.split('T')[0];
        }
        const price = Number(item.close ?? item.price ?? item.value ?? 0);
        return { date: dateStr, price };
    }).filter(p => p.date && p.price > 0).sort((a, b) => a.date.localeCompare(b.date));
};

// Fiyat serisi dönem getirisi: kesim tarihindeki (≥) ilk fiyat → son fiyat.
const priceReturn = (series, cutoff) => {
    if (!series || series.length < 2) return null;
    const start = series.find(p => p.date >= cutoff) || series[0];
    const last = series[series.length - 1];
    if (!start || !last || start.price <= 0 || start.date >= last.date) return null;
    return ((last.price - start.price) / start.price) * 100;
};

// Mevduat: yıllık % oran serisini dönem boyunca bileşikle (her aralıkta o anki oran × gün/365).
const depositReturn = (series, cutoff) => {
    if (!Array.isArray(series) || series.length < 1) return null;
    const pts = series
        .filter(p => p && p.date >= cutoff && p.rate != null)
        .sort((a, b) => a.date.localeCompare(b.date));
    if (pts.length < 1) return null;
    const nowStr = isoOf(new Date());
    let factor = 1;
    for (let i = 0; i < pts.length; i++) {
        const r = Number(pts[i].rate) / 100;
        const next = i < pts.length - 1 ? pts[i + 1].date : nowStr;
        const days = Math.max(0, (new Date(next) - new Date(pts[i].date)) / 86400000);
        factor *= (1 + r * days / 365);
    }
    return (factor - 1) * 100;
};

export function usePerformanceComparison(assetSymbol, assetCategory, labels) {
    const [period, setPeriod] = useState('1y');

    const assetQ = useQuery({
        queryKey: ['perf-asset', assetSymbol, assetCategory],
        queryFn: () => historicalApi.getData({ symbol: assetSymbol, range: FETCH_RANGE, interval: '1d', category: assetCategory }),
        enabled: !!assetSymbol,
        staleTime: 10 * 60 * 1000,
    });
    const bistQ = useQuery({
        queryKey: ['perf-bist'],
        queryFn: () => historicalApi.getData({ symbol: 'XU100.IS', range: FETCH_RANGE, interval: '1d', category: 'INDEX' }),
        staleTime: 30 * 60 * 1000,
    });
    const goldQ = useQuery({
        queryKey: ['perf-gold'],
        queryFn: () => historicalApi.getData({ symbol: 'GRAM_ALTIN', range: FETCH_RANGE, interval: '1d', category: 'COMMODITY' }),
        staleTime: 30 * 60 * 1000,
    });
    const usdQ = useQuery({
        queryKey: ['perf-usd'],
        queryFn: () => currencyApi.getCurrencyHistorical('USD', FETCH_RANGE),
        staleTime: 30 * 60 * 1000,
    });
    const depositQ = useQuery({
        queryKey: ['perf-deposit'],
        queryFn: () => economyApi.getDepositSeries(FETCH_RANGE),
        staleTime: 60 * 60 * 1000,
    });

    const norm = useMemo(() => ({
        asset: normalizeSeries(assetQ.data),
        bist: normalizeSeries(bistQ.data),
        gold: normalizeSeries(goldQ.data),
        usd: normalizeSeries(usdQ.data),
        deposit: Array.isArray(depositQ.data) ? depositQ.data : [],
    }), [assetQ.data, bistQ.data, goldQ.data, usdQ.data, depositQ.data]);

    const rows = useMemo(() => {
        const cutoff = cutoffStr(period);
        return [
            { key: 'asset', label: labels.asset, ret: priceReturn(norm.asset, cutoff), kind: 'asset' },
            { key: 'bist', label: labels.bist, ret: priceReturn(norm.bist, cutoff), kind: 'bench' },
            { key: 'deposit', label: labels.deposit, ret: depositReturn(norm.deposit, cutoff), kind: 'bench' },
            { key: 'gold', label: labels.gold, ret: priceReturn(norm.gold, cutoff), kind: 'bench' },
            { key: 'usd', label: labels.usd, ret: priceReturn(norm.usd, cutoff), kind: 'bench' },
        ].filter(r => r.ret != null && Number.isFinite(r.ret)).sort((a, b) => b.ret - a.ret);
    }, [norm, period, labels]);

    const isLoading = assetQ.isLoading || bistQ.isLoading || goldQ.isLoading || usdQ.isLoading || depositQ.isLoading;
    return { rows, period, setPeriod, isLoading };
}
