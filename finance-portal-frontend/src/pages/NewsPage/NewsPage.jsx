import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Newspaper, Loader2, PlusCircle, MinusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { newsApi } from '../../services/api';
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

// Backend NewsCategoryClassifier kanonik (TR) ile EN değerleri.
// Frontend aktif dile göre value'yu seçer; backend hem TR hem EN'i tanır (canonicalTr map).
const CATEGORIES = [
    { tr: 'Tümü',            en: 'All',          tKey: 'categories.all' },
    { tr: 'Genel Ekonomi',   en: 'Economy',      tKey: 'categories.general' },
    { tr: 'Borsa',           en: 'Stocks',       tKey: 'categories.stock' },
    { tr: 'Döviz & Forex',   en: 'Forex',        tKey: 'categories.currency' },
    { tr: 'Kripto',          en: 'Crypto',       tKey: 'categories.crypto' },
    { tr: 'Emtialar',        en: 'Commodities',  tKey: 'categories.commodity' },
    { tr: 'Tahvil & Faiz',   en: 'Bonds & Rates',tKey: 'categories.bond' },
    { tr: 'Yatırım Fonları', en: 'Funds',        tKey: 'categories.fund' }
];

export default function NewsPage() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation(['news', 'common']);
    const lang = i18n.language?.startsWith('en') ? 'en' : 'tr';

    // Kategori value aktif dile göre üretilir; dil değişince activeCategory karşılığına çevrilir.
    const categories = CATEGORIES.map(c => ({ value: c[lang], tKey: c.tKey, _tr: c.tr }));
    const [activeCategoryTr, setActiveCategoryTr] = useState('Tümü');
    const activeCategory = (CATEGORIES.find(c => c.tr === activeCategoryTr) || CATEGORIES[0])[lang];
    const setActiveCategory = (value) => {
        const found = CATEGORIES.find(c => c.tr === value || c.en === value);
        setActiveCategoryTr(found ? found.tr : 'Tümü');
    };

    const [page, setPage] = useState(0);
    const [accumulatedNews, setAccumulatedNews] = useState([]);
    const [verifiedImages, setVerifiedImages] = useState({});

    const { data: responseData, isLoading: loading, isFetching: loadingMore } = useQuery({
        queryKey: ['newsPage', activeCategoryTr, page, lang],
        queryFn: () => newsApi.getNewsPage(activeCategory, page, lang, 12),
        staleTime: 60 * 1000,
        keepPreviousData: true
    });

    useEffect(() => {
        setPage(0);
        setAccumulatedNews([]);
    }, [activeCategoryTr, lang]);

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
    const PAGE_SIZE = 12;
    // İlk sayfa hariç bir sayfa daha yüklenmişse "Daha Az" görünür
    const canShowLess = accumulatedNews.length > PAGE_SIZE;

    const handleNewsClick = (item) => {
        navigate('/news/detail', { state: { newsItem: item } });
    };

    const handleShowLess = () => {
        setAccumulatedNews(prev => prev.slice(0, Math.max(PAGE_SIZE, prev.length - PAGE_SIZE)));
        setPage(p => Math.max(0, p - 1));
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg">
            <div className="p-4 md:p-8 max-w-[1100px] mx-auto text-text w-full">
                <header className="mb-8 mt-4">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                        <Newspaper className="text-primary" size={36} /> {t('news:pageTitle')}
                    </h1>
                </header>

                <NewsCategoryTabs
                    categories={categories}
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

                        {(hasNext || canShowLess) && (
                            <div className="mt-8 mb-12 flex flex-col sm:flex-row items-center justify-center gap-3">
                                {canShowLess && (
                                    <button
                                        onClick={handleShowLess}
                                        className="flex items-center gap-2 px-8 py-4 bg-surface-2 border border-border rounded-full hover:bg-surface-hover hover:border-border-strong transition-all text-sm font-bold shadow-lg"
                                    >
                                        <MinusCircle size={20} /> {t('common:actions.viewLess')}
                                    </button>
                                )}
                                {hasNext && (
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={loadingMore}
                                        className="flex items-center gap-2 px-10 py-4 bg-surface-2 border border-border rounded-full hover:bg-primary hover:text-primary-fg transition-all text-sm font-bold shadow-2xl disabled:opacity-50"
                                    >
                                        {loadingMore ? <Loader2 className="animate-spin" size={20} /> : <><PlusCircle size={20}/> {t('common:actions.viewMore')}</>}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
