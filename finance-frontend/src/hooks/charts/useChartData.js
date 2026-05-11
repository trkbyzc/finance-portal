import { useQuery } from '@tanstack/react-query';
import { historicalApi } from '../../services/api';
// 🚀 FAZ-4 EKLENTİSİ: Sabitlerimiz geldi
import { QUERY_CONFIG } from '../../constants/config';

// Helper: Range'e göre interval belirle
const getIntervalForRange = (range) => {
    if (range === '1d') return '15m';
    if (range === '5d' || range === '1w') return '60m';
    if (range === '5y') return '1wk';
    return '1d';
};

// 🚀 KURŞUN GEÇİRMEZ TRANSFORMER (Az önce çözdüğümüz hayat kurtaran filtre)
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

export const useChartData = (backendSymbol, activeRange, customStartDate, customEndDate, isNone) => {
    return useQuery({
        queryKey: ['chartData', backendSymbol, activeRange, customStartDate, customEndDate],
        queryFn: async () => {
            let data;
            if (activeRange === 'custom') {
                // 🚀 OBJE OLARAK YOLLUYORUZ
                data = await historicalApi.getCustomRange({
                    symbol: backendSymbol,
                    startDate: customStartDate,
                    endDate: customEndDate
                });
            } else {
                const interval = getIntervalForRange(activeRange);
                // 🚀 OBJE OLARAK YOLLUYORUZ
                data = await historicalApi.getData({
                    symbol: backendSymbol,
                    range: activeRange,
                    interval: interval
                });
            }
            const dataArray = Array.isArray(data) ? data : (data?.priceData || data || []);
            return transformChartData(dataArray);
        },
        enabled: !!backendSymbol && !isNone,
        // 🚀 FAZ-4: MAGIC NUMBER GİTTİ, MERKEZİ SABİT GELDİ (1 Dakika)
        staleTime: QUERY_CONFIG.STALE_TIME.DEFAULT,
        retry: 1
    });
};