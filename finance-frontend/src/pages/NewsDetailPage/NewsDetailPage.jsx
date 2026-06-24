import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { newsApi } from '../../services/api';

import NewsArticle from './components/NewsArticle';
import NewsSidebar from './components/NewsSidebar';

export default function NewsDetailPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { i18n, t } = useTranslation('news');
    const lang = i18n.language?.startsWith('en') ? 'en' : 'tr';
    const newsItem = location.state?.newsItem;

    // Sayfa açıldığında hep en üste kaydır ve data yoksa genel haberlere at
    useEffect(() => {
        window.scrollTo(0, 0);
        if (!newsItem) navigate('/news');
    }, [newsItem, navigate]);

    // queryKey'e lang ekli: dil değişince content yeniden çekilir (EN için backend çeviri yapar).
    const { data: contentData, isLoading: contentLoading } = useQuery({
        queryKey: ['newsContent', newsItem?.link, lang],
        queryFn: async () => {
            try {
                const res = await newsApi.getNewsContent(newsItem.link, lang);
                return res?.content || t('detail.notFound');
            } catch {
                return t('detail.notFound');
            }
        },
        enabled: !!newsItem
    });

    const { data: sidebarData = [] } = useQuery({
        queryKey: ['sidebarNews', lang],
        queryFn: async () => {
            const res = await newsApi.getNewsPage(lang === 'en' ? 'All' : 'Tümü', 0, lang, 6);
            return res?.content || [];
        },
        enabled: !!newsItem
    });

    if (!newsItem) return null;

    const sidebarNews = sidebarData
        .filter(n => n.link !== newsItem.link)
        .slice(0, 5);

    return (
        <div className="flex flex-col min-h-screen bg-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-8 text-text flex flex-col lg:flex-row gap-6 lg:gap-10 w-full mt-4">
                <NewsArticle
                    newsItem={newsItem}
                    content={contentData || ''}
                    loading={contentLoading}
                    navigate={navigate}
                />
                <NewsSidebar
                    sidebarNews={sidebarNews}
                    navigate={navigate}
                />
            </div>
        </div>
    );
}