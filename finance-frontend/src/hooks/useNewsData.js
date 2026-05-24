import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../services/api';

/**
 * @param {string} category - Backend NewsCategoryClassifier sabitlerinden biri.
 *   Geçerli değerler: 'Tümü', 'Genel Ekonomi', 'Borsa', 'Döviz & Forex',
 *   'Kripto', 'Emtialar', 'Tahvil & Faiz', 'Yatırım Fonları'.
 *   Verilmezse tüm haberler döner.
 */
export const useNewsData = (category = 'Tümü') => {
    const { data, isLoading: loading, error } = useQuery({
        queryKey: ['news', category],
        queryFn: async () => {
            try {
                const response = await newsApi.getNewsPage(category, 0, 20);
                if (Array.isArray(response)) return response;
                return response?.content || response?.data || response?.items || [];
            } catch (err) {
                console.error("Haberler çekilirken hata oluştu:", err);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000
    });

    const news = Array.isArray(data) ? data : [];
    const topNews = news.length > 0 ? news.slice(0, 5) : [];
    const recentNews = news.length > 5 ? news.slice(5) : [];

    return {
        news,
        topNews,
        recentNews,
        loading,
        error: error ? error.message : null
    };
};
