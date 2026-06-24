import { useState, useMemo } from 'react';
import { useMarketData } from '../../../../hooks/useMarketData';
import { useNewsData } from '../../../../hooks/useNewsData';
import CommodityHeader from './components/CommodityHeader';
import CommodityTabs from './components/CommodityTabs';
import CommodityTable from './components/CommodityTable';
import CommodityNewsSidebar from './components/CommodityNewsSidebar';

export default function CommoditiesDashboard() {
    const { data: commodities, loading: isLoading } = useMarketData('commodities');
    const { news, loading: loadingNews } = useNewsData('Emtialar');
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    // Emtia sembolünün önek kalıbına göre kategori döndürür; bazı API kayıtları code yerine symbol gönderir.
    const getCategory = (code) => {
        if (!code) return 'others';

        const c = code.toString().toUpperCase();

        if (c.includes('GC') || c.includes('GA') || c.includes('SI') || c.includes('GAG') || c.includes('XAU') || c.includes('XAG')) return 'precious';
        if (c.includes('CL') || c.includes('BZ') || c.includes('NG')) return 'energy';
        if (c.includes('HG')) return 'industrial';
        if (c.includes('ZW') || c.includes('ZC') || c.includes('KC') || c.includes('CC') || c.includes('CT')) return 'agriculture';

        return 'others';
    };

    // searchQuery veya activeCategory her değiştiğinde tüm listeyi yeniden filtrelemekten kaçınır.
    const filteredCommodities = useMemo(() => {
        if (!commodities || !Array.isArray(commodities)) return [];

        let result = commodities;

        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(c =>
                (c.currencyCode?.toLowerCase().includes(query)) ||
                (c.currencyName?.toLowerCase().includes(query))
            );
        }

        if (activeCategory !== "all") {
            result = result.filter(c => {
                const itemCode = c.currencyCode || c.symbol || "";
                return getCategory(itemCode) === activeCategory;
            });
        }

        return result;
    }, [searchQuery, activeCategory, commodities]);

    return (
        <div className="min-h-screen bg-bg text-text">
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
            <CommodityHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <CommodityTabs
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
            />

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-2/3 xl:w-3/4">
                    <CommodityTable
                        data={filteredCommodities}
                        loading={isLoading}
                    />
                </div>

                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <CommodityNewsSidebar
                        news={news}
                        loading={loadingNews}
                    />
                </div>
            </div>
          </div>
        </div>
    );
}