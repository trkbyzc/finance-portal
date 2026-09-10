import { useQuery } from '@tanstack/react-query';
import { historicalApi } from '../../services/api';
import { QUERY_CONFIG } from '../../constants/config';

const getIntervalForRange = (range) => {
    const r = range.toLowerCase();
    if (r === '1d' || r === '1g') return '15m'; // 1 Günlük grafikte 15 dakikalık mum
    if (r === '5d' || r === '1w' || r === '1h') return '60m'; // 1 Haftalık grafikte saatlik mum
    if (r === '5y') return '1wk'; // 5 Yıllık grafikte haftalık mum
    return '1d'; // Geri kalan her şey (1A, 3A, 6A, 1Y) için günlük mum
};

// Backend'in ve Yahoo'nun kafası karışmasın diye Türkçe range'leri İngilizceye çevir
const normalizeRange = (range) => {
    const r = range.toLowerCase();
    if (r === '1g') return '1d';
    if (r === '1h') return '1mo'; // Yahoo'da 1 hafta genelde 1 ayın içi veya 5d olarak çekilir. '5d' de yapabilirsin.
    if (r === '1a') return '1mo';
    if (r === '3a') return '3mo';
    if (r === '6a') return '6mo';
    return r; // ytd, 1y, 5y gibi olanlar aynı kalır
};

// TR tahvili (DİBS) backend'i range'i yok sayıp tüm geçmişi döner. Seçilen aralığı
// anlamlı kılmak için client-side dilimleriz (son N gün / YBİ / hepsi).
const RANGE_DAYS = { '1mo': 31, '3mo': 93, '6mo': 186, '1y': 372, '5y': 1830, '5d': 6, '1d': 2 };
const sliceByRange = (data, range) => {
    if (!data?.length) return data;
    const r = (range || '').toLowerCase();
    if (r === '5y' || r === 'custom') return data; // 5Y/Tarih → tüm mevcut geçmiş
    let cutoff;
    if (r === 'ytd' || r === 'ybi') {
        const now = new Date();
        cutoff = new Date(now.getFullYear(), 0, 1).getTime();
    } else {
        const days = RANGE_DAYS[r];
        if (days == null) return data;
        cutoff = Date.now() - days * 86400000;
    }
    const sliced = data.filter(p => p.timestamp != null && p.timestamp >= cutoff);
    // Aralıkta veri yoksa boş grafik göstermemek için son birkaç noktaya düş.
    return sliced.length >= 2 ? sliced : data.slice(-Math.min(data.length, 30));
};

const transformChartData = (rawData) => {
    return rawData
        .filter(item => (item.timestamp || item.date) && (item.close != null || item.price != null || item.value != null))
        .map(item => {
            let exactTimestamp = item.timestamp;
            let formattedDate = item.date;

            // Tarih array olarak gelirse [2026, 5, 10] düzelt
            if (Array.isArray(item.date)) {
                formattedDate = `${item.date[0]}-${String(item.date[1]).padStart(2, '0')}-${String(item.date[2]).padStart(2, '0')}`;
            }

            if (!exactTimestamp && formattedDate) {
                const d = new Date(`${formattedDate}T00:00:00Z`);
                exactTimestamp = d.getTime() + (d.getTimezoneOffset() * 60000);
            }

            // Gelen verideki fiyatı garantile (close yoksa price, o da yoksa value)
            const basePrice = item.close ?? item.price ?? item.value ?? 0;

            return {
                timestamp: exactTimestamp,
                dateStr: formattedDate || new Date(exactTimestamp).toISOString().split('T')[0],
                open: Number(item.open ?? basePrice),
                high: Number(item.high ?? basePrice),
                low: Number(item.low ?? basePrice),
                close: Number(basePrice),
                volume: Number(item.volume ?? 0)
            };
        })
        .sort((a, b) => a.timestamp - b.timestamp);
};

export const useChartData = (backendSymbol, category, activeRange, customStartDate, customEndDate, isNone) => {
    return useQuery({
        // Aynı sembol farklı kategorilerde farklı veri döndürebildiği için category da key'e dahil.
        queryKey: ['chartData', backendSymbol, category, activeRange, customStartDate, customEndDate],
        queryFn: async () => {
            let data;
            const normalizedRange = normalizeRange(activeRange);

            if (activeRange === 'custom') {
                data = await historicalApi.getCustomRange({
                    symbol: backendSymbol,
                    category: category || 'UNKNOWN',
                    startDate: customStartDate,
                    endDate: customEndDate
                });
            } else {
                const interval = getIntervalForRange(activeRange);
                data = await historicalApi.getData({
                    symbol: backendSymbol,
                    category: category || 'UNKNOWN',
                    range: normalizedRange,
                    interval: interval
                });
            }
            const dataArray = Array.isArray(data) ? data : (data?.priceData || data || []);
            const transformed = transformChartData(dataArray);
            // TR tahvilinde backend range'i yok sayar → seçilen aralığı client-side uygula.
            const isTrBond = (category || '').toUpperCase() === 'TR_BOND'
                || (backendSymbol || '').toUpperCase().startsWith('TP.');
            return isTrBond ? sliceByRange(transformed, activeRange) : transformed;
        },
        enabled: !!backendSymbol && !isNone,
        staleTime: QUERY_CONFIG.STALE_TIME.DEFAULT,
        retry: 1
    });
};