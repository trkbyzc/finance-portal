import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../services/api';

export const useNewsData = () => {
    const { data, isLoading: loading, error } = useQuery({
        queryKey: ['allNews'],
        queryFn: async () => {
            try {
                const response = await newsApi.getAllNews();
                // Response objesinin içinde nerede content varsa onu al, yoksa boş array
                return Array.isArray(response) ? response : (response?.data || response?.content || response?.items || []);
            } catch (err) {
                console.error("Haberler çekilirken hata oluştu:", err);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000
    });

    // 🚀 DÜZELTME: Sidebar vb bileşenlerin "news.map is not a function" diyerek çökmesini ENGELLE.
    // Her ne olursa olsun her zaman Map'lenebilir ARRAY dön.
    const news = Array.isArray(data) ? data : [];

    // Slice çalıştırırken array olduğundan emin olduğumuz için artık hata vermez
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