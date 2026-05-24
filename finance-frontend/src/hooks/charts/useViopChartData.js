import { useQuery } from '@tanstack/react-query';
import { historicalApi } from '../../services/api';
// 🚀 FAZ-4 EKLENTİSİ: Sabitlerimiz geldi
import { QUERY_CONFIG } from '../../constants/config';

/**
 * 🚀 FAZA 1: useEffect Temizliği
 * 🚀 FAZA 3: Service Layer Refactoring - historicalApi kullanımı
 * ViopTradingChart için historical data sağlar
 */

// Helper: Geçmiş tarih hesapla
export const getPastDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
};

// 🚀 KURŞUN GEÇİRMEZ TRANSFORMER
const transformViopData = (rawData) => {
    return rawData
        .filter(item => (item.timestamp || item.date) && (item.close != null || item.price != null || item.value != null))
        .map(item => {
            let exactTimestamp = item.timestamp;
            let formattedDate = item.date;

            if (Array.isArray(item.date)) {
                formattedDate = `${item.date[0]}-${String(item.date[1]).padStart(2, '0')}-${String(item.date[2]).padStart(2, '0')}`;
            }

            if (!exactTimestamp && formattedDate) {
                const d = new Date(`${formattedDate}T00:00:00Z`);
                exactTimestamp = d.getTime() + (d.getTimezoneOffset() * 60000);
            }

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

export const useViopChartData = (symbol, fromDate, toDate, range = '1mo') => {
    return useQuery({
        queryKey: ['viopChartData', symbol, range],
        queryFn: async () => {
            // range'i direkt gönder — backend ViopScraperClient'ın switch'i (1w/1mo/3mo/6mo/1y)
            // bunu doğru şekilde işliyor. getCustomRange ile gönderince range='custom' olup
            // default 1y'a düşüyordu (H/A/Y filtreleri aynı sonuç veriyordu).
            const response = await historicalApi.getData({
                symbol: symbol,
                category: 'VIOP',
                range: range,
                interval: '1d'
            });
            const dataArray = Array.isArray(response) ? response : (response?.priceData || response || []);
            return transformViopData(dataArray);
        },
        enabled: !!symbol && !!range,
        staleTime: QUERY_CONFIG.STALE_TIME.DEFAULT,
        retry: 1
    });
};