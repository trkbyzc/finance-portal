import { apiClient } from '../../config/apiClient';

/**
 * 🚀 FAZA 3: Historical Data API
 * Tarihsel fiyat verilerini çekmek için API fonksiyonları
 */
export const historicalApi = {
    /**
     * Tarihsel veri çek (params object ile)
     * @param {Object} params - { symbol, range, interval, startDate, endDate }
     */
    getData: async (params) => {
        // apiClient interceptor zaten response.data döndürüyor
        return await apiClient.get('/market-data/historical', { params });
    },

    /**
     * 🚀 VİOP ve Custom Date (Özel Tarih) Grafikleri İçin Eksik Olan Fonksiyon
     * Özel tarih aralığında veri çeker.
     * @param {Object} params - { symbol, startDate, endDate }
     */
    getCustomRange: async (params) => {
        const customParams = { ...params, range: 'custom', interval: '1d' };
        return await apiClient.get('/market-data/historical', { params: customParams });
    },

    /**
     * Tarihsel veri çek (eski format - backward compatibility)
     * @param {string} symbol - Sembol
     * @param {string} range - Zaman aralığı
     */
    getHistoricalData: async (symbol, range) => {
        // apiClient interceptor zaten response.data döndürüyor
        return await apiClient.get('/market-data/historical', {
            params: { symbol, range }
        });
    }
};