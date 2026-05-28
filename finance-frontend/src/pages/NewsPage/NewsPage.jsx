import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Newspaper, Loader2, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

// Backend NewsCategoryClassifier sabitleri ile birebir eşleşmek zorunda.
const CATEGORIES = [
    { value: 'Tümü', tKey: 'categories.all' },
    { value: 'Genel Ekonomi', tKey: 'categories.general' },
    { value: 'Borsa', tKey: 'categories.stock' },
    { value: 'Döviz & Forex', tKey: 'categories.currency' },
    { value: 'Kripto', tKey: 'categories.crypto' },
    { value: 'Emtialar', tKey: 'categories.commodity' },
    { value: 'Tahvil & Faiz', tKey: 'categories.bond' },
    { value: 'Yatırım Fonları', tKey: 'categories.fund' }
];

export default function NewsPage() {
    const navigate = useNavigate();
    const { t } = useTranslation(['news', 'common']);

    const [activeCategory, setActiveCategory] = useState('Tümü');
    const [page, setPage] = useState(0);
    const [accumulatedNews, setAccumulatedNews] = useState([]);
    const [verifiedImages, setVerifiedImages] = useState({});

    const { data: responseData, isLoading: loading, isFetching: loadingMore } = useQuery({
        queryKey: ['newsPage', activeCategory, page],
        queryFn: () => newsApi.getNewsPage(activeCategory, page),
        staleTime: 60 * 1000,
        keepPreviousData: true
    });

    useEffect(() => {
        setPage(0);
        setAccumulatedNews([]);
    }, [activeCategory]);

    useEffect(() => {
        if (!responseData || !responseData.content) return;

        setAccumulatedNews(prev =>
            page === 0 ? responseData.content : [...prev, ...responseData.content]
        );

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
        <div className="flex flex-col min-h-screen bg-bg">
            <MarketTicker />
            <div className="p-6 md:p-8 max-w-[1100px] mx-auto text-text w-full">
                <header className="mb-8 mt-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                        <Newspaper className="text-primary" size={36} /> {t('news:pageTitle')}
                    </h1>
                </header>

                <NewsCategoryTabs
                    categories={CATEGORIES}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                />

                {loading && page === 0 ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={48} /></div>
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
                                className="mt-8 mb-12 mx-auto flex items-center gap-2 px-10 py-4 bg-surface-2 border border-border rounded-full hover:bg-primary transition-all text-sm font-bold shadow-2xl disabled:opacity-50"
                            >
                                {loadingMore ? <Loader2 className="animate-spin" size={20} /> : <><PlusCircle size={20}/> {t('common:actions.viewMore')}</>}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
