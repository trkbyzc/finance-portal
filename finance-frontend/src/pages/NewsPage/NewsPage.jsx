import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Newspaper, Loader2, PlusCircle } from 'lucide-react';

// 🚀 GÜNCELLENDİ: Eski newsService silindi, yeni newsApi eklendi!
import { newsApi } from '../../services/api';
import MarketTicker from '../../components/layout/MarketTicker/MarketTicker.jsx';
import NewsCategoryTabs from './components/NewsCategoryTabs';
import NewsCard from './components/NewsCard';

const validateImage = (url) => {
    return new Promise((resolve) => {
        if (!url || !url.startsWith('http')) resolve(false);
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
    });
};

export default function NewsPage() {
    const navigate = useNavigate();

    const [activeCategory, setActiveCategory] = useState('Tümü');
    const [page, setPage] = useState(0);
    const [accumulatedNews, setAccumulatedNews] = useState([]);
    const [verifiedImages, setVerifiedImages] = useState({});

    const categories = ['Tümü', 'Genel Ekonomi', 'Döviz Kurları', 'Kripto', 'Emtialar'];

    // 🚀 Yeni İstek - React Query
    const { data: responseData, isLoading: loading, isFetching: loadingMore } = useQuery({
        queryKey: ['newsPage', activeCategory, page],
        // 🚀 GÜNCELLENDİ: newsService yerine newsApi kullanıyoruz
        queryFn: () => newsApi.getNewsPage(activeCategory, page),
        staleTime: 60 * 1000,
        keepPreviousData: true
    });

    // Kategori değiştiğinde geçmişi sıfırla
    useEffect(() => {
        setPage(0);
        setAccumulatedNews([]);
    }, [activeCategory]);

    // Veri ReactQuery'den her geldiğinde listeye ekle ve görsellerini doğrula
    useEffect(() => {
        if (!responseData || !responseData.content) return;

        setAccumulatedNews(prev =>
            page === 0 ? responseData.content : [...prev, ...responseData.content]
        );

        // Async Resim doğrulamaları
        responseData.content.forEach(async (item) => {
            const isValid = await validateImage(item.imageUrl);
            setVerifiedImages(prev => ({ ...prev, [item.imageUrl]: isValid }));
        });

    }, [responseData, page]);

    const hasNext = responseData?.hasNext || false;

    const handleNewsClick = (item) => {
        navigate('/news/detail', { state: { newsItem: item } });
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#0b0e14]">
            <MarketTicker />
            <div className="p-6 md:p-8 max-w-[1100px] mx-auto text-white w-full">
                <header className="mb-8 mt-4">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Newspaper className="text-[#2962ff]" size={36} /> Haberler
                    </h1>
                </header>

                <NewsCategoryTabs
                    categories={categories}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                />

                {loading && page === 0 ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#2962ff]" size={48} /></div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {accumulatedNews.map((item, index) => (
                            <NewsCard
                                key={`${item.link}-${index}`}
                                item={item}
                                isVerified={verifiedImages[item.imageUrl] === true}
                                onClick={() => handleNewsClick(item)}
                            />
                        ))}

                        {hasNext && (
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={loadingMore}
                                className="mt-8 mb-12 mx-auto flex items-center gap-2 px-10 py-4 bg-[#1e222d] border border-[#2a2e39] rounded-full hover:bg-[#2962ff] transition-all text-sm font-bold shadow-2xl disabled:opacity-50"
                            >
                                {loadingMore ? <Loader2 className="animate-spin" size={20} /> : <><PlusCircle size={20}/> Daha Fazla Haber Yükle</>}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}