import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../../services/api';

import NewsArticle from './components/NewsArticle';
import NewsSidebar from './components/NewsSidebar';

export default function NewsDetailPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const newsItem = location.state?.newsItem;

    // Sayfa açıldığında hep en üste kaydır ve data yoksa genel haberlere at
    useEffect(() => {
        window.scrollTo(0, 0);
        if (!newsItem) navigate('/news');
    }, [newsItem, navigate]);

    // 1. Ana Haber Metni Query'si (Sadece url varsa çalışır)
    const { data: contentData, isLoading: contentLoading } = useQuery({
        queryKey: ['newsContent', newsItem?.link],
        queryFn: async () => {
            try {
                // Merkezi servisimizi kullanarak haberi scrape ediyoruz
                const res = await newsApi.getNewsContent(newsItem.link);
                return res?.content || "Gerçek içerik okunamadı veya site engelledi. Orijinal kaynağa gidebilirsiniz.";
            } catch (err) {
                return "Haber metni çekilirken bir sorun oluştu. Orijinal kaynağa giderek okuyabilirsiniz.";
            }
        },
        enabled: !!newsItem // Yalnızca valid bir URL varsa çek (Bomba patlamaması için)
    });

    // 2. Sidebar (Popüler) Haberler Query'si
    const { data: sidebarData = [] } = useQuery({
        queryKey: ['sidebarNews'],
        queryFn: async () => {
            // Merkezi servisten 'Tümü' kategorisini ve ilk sayfasını istiyoruz
            const res = await newsApi.getNewsPage('Tümü', 0, 6);
            return res?.content || [];
        },
        enabled: !!newsItem
    });

    if (!newsItem) return null;

    // Mevcut (okunan) haberi sidebar'dan hariç tut ve 5 tanesini limite et
    const sidebarNews = sidebarData
        .filter(n => n.link !== newsItem.link)
        .slice(0, 5);

    return (
        <div className="flex flex-col min-h-screen bg-bg">
            <div className="max-w-[1200px] mx-auto p-4 md:p-8 text-text flex flex-col lg:flex-row gap-10 w-full mt-4">
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