import { useQuery } from '@tanstack/react-query';
import { historicalApi } from '../../services/api';
// 🚀 FAZ-4 EKLENTİSİ: Sabitlerimiz geldi
import { QUERY_CONFIG } from '../../constants/config';

/**
 * 🚀 FAZA 1: useEffect Temizliği
 * 🚀 FAZA 3: Service Layer Refactoring - historicalApi kullanımı
 * FundTradingChart için historical data sağlar
 */

// 🚀 KURŞUN GEÇİRMEZ TRANSFORMER
const transformFundData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) {
        console.warn('useFundChartData: Invalid data received', rawData);
        return [];
    }

    return rawData
        .filter(item => (item.timestamp || item.date) && (item.close != null || item.price != null || item.value != null))
        .map(item => {
            let exactTimestamp = item.timestamp;
            let formattedDate = item.date;

            // Tarih array olarak gelirse [2026, 5, 10] düzelt
            if (Array.isArray(item.date)) {
                formattedDate = `${item.date[0]}-${String(item.date[1]).padStart(2, '0')}-${String(item.date[2]).padStart(2, '0')}`;
            } else if (typeof item.date === 'string') {
                formattedDate = item.date.split('T')[0]; // ISO formatından sadece tarihi al
            }

            if (!exactTimestamp && formattedDate) {
                const d = new Date(`${formattedDate}T00:00:00Z`);
                exactTimestamp = d.getTime() + (d.getTimezoneOffset() * 60000);
            }

            // Gelen verideki geçerli fiyatı bul
            const basePrice = item.close ?? item.price ?? item.value ?? 0;

            return {
                timestamp: exactTimestamp,
                dateStr: formattedDate || new Date(exactTimestamp).toISOString().split('T')[0],
                close: Number(basePrice), // Chart'ta "close" olarak kullanılıyor
                price: Number(basePrice),  // Backward compatibility için
                volume: Number(item.volume ?? 0)
            };
        })
        .sort((a, b) => a.timestamp - b.timestamp);
};

export const useFundChartData = (symbol, range, isTefas) => {
    return useQuery({
        queryKey: ['fundChartData', symbol, range, isTefas],
        queryFn: async () => {
            // 🚀 OBJE OLARAK YOLLUYORUZ
            const response = await historicalApi.getData({
                symbol: symbol,
                range: range,
                interval: '1d'
            });
            const dataArray = Array.isArray(response) ? response : (response?.priceData || response || []);
            return transformFundData(dataArray);
        },
        enabled: !!symbol,
        // 🚀 FAZ-4: MAGIC NUMBER GİTTİ, MERKEZİ SABİT GELDİ
        staleTime: QUERY_CONFIG.STALE_TIME.DEFAULT,
        retry: 1
    });
};